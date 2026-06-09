import { Global, Module } from '@nestjs/common';
import { TransactionInterceptor } from './transaction.interceptor';
import { TransactionService } from './transaction.service';

@Global()
@Module({
  providers: [TransactionService, TransactionInterceptor],
  exports: [TransactionService, TransactionInterceptor],
})
export class TransactionModule {}