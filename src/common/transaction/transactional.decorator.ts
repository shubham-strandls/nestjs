import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { TransactionInterceptor } from './transaction.interceptor';

export const Transactional = () => applyDecorators(UseInterceptors(TransactionInterceptor));