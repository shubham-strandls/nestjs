import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { firstValueFrom, Observable, from } from 'rxjs';
import { TransactionService } from './transaction.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly transactionService: TransactionService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return from(
      this.transactionService.run(() => firstValueFrom(next.handle())),
    );
  }
}