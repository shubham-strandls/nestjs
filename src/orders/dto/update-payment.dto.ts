import { PaymentStatus } from '../schemas/order.schema';

export class UpdatePaymentDto {
  paymentStatus: PaymentStatus.PAID | PaymentStatus.FAILED;
}