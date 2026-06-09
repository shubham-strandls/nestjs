import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { AsyncLocalStorage } from 'async_hooks';
import { ClientSession, Connection } from 'mongoose';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly storage = new AsyncLocalStorage<ClientSession>();

  constructor(@InjectConnection() private readonly connection: Connection) {}

  getSession(): ClientSession | undefined {
    return this.storage.getStore();
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();
    this.logger.log('Transaction started');

    return new Promise<T>((resolve, reject) => {
      this.storage.run(session, () => {
        fn()
          .then(async (result) => {
            await session.commitTransaction();
            this.logger.log('Transaction committed');
            resolve(result);
          })
          .catch(async (err) => {
            await session.abortTransaction();
            this.logger.error(`Transaction aborted — ${err.message}`, err.stack);
            reject(err);
          })
          .finally(() => session.endSession());
      });
    });
  }
}