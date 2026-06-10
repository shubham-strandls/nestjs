export class OrderItemDto {
  productId: string;
  quantity: number;
  price: number;
}

export class CreateOrderDto {
  userId: string;
  items: OrderItemDto[];
  totalAmount: number;
}