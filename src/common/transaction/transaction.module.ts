import { Global, Module } from '@nestjs/common';
import { PostHogModule } from '../../posthog/posthog.module';
import { TransactionInterceptor } from './transaction.interceptor';
import { TransactionService } from './transaction.service';

@Global()
@Module({
  imports: [PostHogModule],
  providers: [TransactionService, TransactionInterceptor],
  exports: [TransactionService, TransactionInterceptor],
})
export class TransactionModule {}