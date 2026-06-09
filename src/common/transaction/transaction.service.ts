import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { AsyncLocalStorage } from 'async_hooks';
import { ClientSession, Connection } from 'mongoose';
import { PostHogService } from '../../posthog/posthog.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly storage = new AsyncLocalStorage<ClientSession>();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly postHog: PostHogService,
  ) {}

  getSession(): ClientSession | undefined {
    return this.storage.getStore();
  }

  async getActiveTransactions(): Promise<unknown> {
    if (!this.connection.db) return { inprog: [] };
    return this.connection.db.admin().command({ currentOp: true, active: true });
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();
    this.logger.log('Transaction started');
    this.postHog.capture('server', 'transaction_started');

    return new Promise<T>((resolve, reject) => {
      this.storage.run(session, () => {
        fn()
          .then(async (result) => {
            await session.commitTransaction();
            this.logger.log('Transaction committed');
            this.postHog.capture('server', 'transaction_committed');
            resolve(result);
          })
          .catch(async (err) => {
            await session.abortTransaction();
            this.logger.error(`Transaction aborted — ${err.message}`, err.stack);
            this.postHog.captureException(err, 'server', { reason: err.message });
            reject(err);
          })
          .finally(() => session.endSession());
      });
    });
  }
}