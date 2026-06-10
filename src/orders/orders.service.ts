import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {ConfigService} from '@nestjs/config';
import {Model} from 'mongoose';
import {Order, OrderDocument, OrderStatus, PaymentStatus} from './schemas/order.schema';
import {CreateOrderDto} from './dto/create-order.dto';
import {UpdatePaymentDto} from './dto/update-payment.dto';
import {SqsService} from '../common/sqs/sqs.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly sqsService: SqsService,
    private readonly config: ConfigService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<OrderDocument> {
    return await this.orderModel.create(dto);
  }

  async updatePayment(orderId: string, dto: UpdatePaymentDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    order.paymentStatus = dto.paymentStatus;

    if (dto.paymentStatus === PaymentStatus.PAID) {
      order.status = OrderStatus.CONFIRMED;
      await this.publishInventoryUpdate(order);
    } else {
      order.status = OrderStatus.CANCELLED;
    }

    return order.save();
  }

  private async publishInventoryUpdate(order: OrderDocument): Promise<void> {
    const queueUrl = this.config.getOrThrow<string>('SQS_INVENTORY_QUEUE_URL');
    await this.sqsService.sendMessage(queueUrl, {
      type: 'INVENTORY_UPDATE',
      orderId: order._id,
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }
}