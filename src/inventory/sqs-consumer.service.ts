import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { InventoryService } from './inventory.service';

interface InventoryUpdatePayload {
  type: 'INVENTORY_UPDATE';
  orderId: string;
  userId: string;
  items: { productId: string; quantity: number }[];
}

@Injectable()
export class SqsConsumerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly client: SQSClient;
  private readonly logger = new Logger(SqsConsumerService.name);
  private pollingTimer: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly inventoryService: InventoryService,
  ) {
    this.client = new SQSClient({
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  onApplicationBootstrap() {
    const intervalMs = this.config.get<number>('SQS_POLL_INTERVAL_MS', 5000);
    this.pollingTimer = setInterval(() => this.poll(), intervalMs);
    this.logger.log(`SQS consumer started — polling every ${intervalMs}ms`);
  }

  onApplicationShutdown() {
    clearInterval(this.pollingTimer);
    this.logger.log('SQS consumer stopped');
  }

  private async poll(): Promise<void> {
    const queueUrl = this.config.getOrThrow<string>('SQS_INVENTORY_QUEUE_URL');

    try {
      const { Messages } = await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 0,
        }),
      );

      if (!Messages?.length) return;

      await Promise.all(Messages.map((msg) => this.processMessage(msg, queueUrl)));
    } catch (error) {
      this.logger.error('SQS poll error', error);
    }
  }

  private async processMessage(message: Message, queueUrl: string): Promise<void> {
    try {
      const payload = JSON.parse(message.Body ?? '{}') as InventoryUpdatePayload;

      if (payload.type === 'INVENTORY_UPDATE') {
        await Promise.all(
          payload.items.map((item) =>
            this.inventoryService.decrementStock(item.productId, item.quantity),
          ),
        );
        this.logger.log(`Inventory updated for order: ${payload.orderId}`);
      }

      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to process message ${message.MessageId} — will retry`, error);
      // intentionally not deleting: message re-appears after visibility timeout
    }
  }
}