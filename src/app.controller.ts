import { Controller, Get } from '@nestjs/common';
import { TransactionService } from './common/transaction/transaction.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
