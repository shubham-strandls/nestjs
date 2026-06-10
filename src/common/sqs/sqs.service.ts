import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
} from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

@Injectable()
export class SqsService {
  private readonly client: SQSClient;
  private readonly logger = new Logger(SqsService.name);

  constructor(private readonly config: ConfigService) {
    this.client = new SQSClient({
      region: this.config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async sendMessage(queueUrl: string, body: object): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(body),
    });

    try {
      const result = await this.client.send(command);
      this.logger.log(`SQS message sent: ${result.MessageId}`);
    } catch (error) {
      this.logger.error('Failed to send SQS message', error);
      throw error;
    }
  }

  async sendBatch(queueUrl: string, messages: object[]): Promise<void> {
    const entries: SendMessageBatchRequestEntry[] = messages.map((msg) => ({
      Id: randomUUID(),
      MessageBody: JSON.stringify(msg),
    }));

    const command = new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: entries,
    });

    try {
      const result = await this.client.send(command);
      if (result.Failed?.length) {
        this.logger.error(`SQS batch: ${result.Failed.length} messages failed`);
      }
      this.logger.log(`SQS batch sent: ${result.Successful?.length} messages`);
    } catch (error) {
      this.logger.error('Failed to send SQS batch', error);
      throw error;
    }
  }
}