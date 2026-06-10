import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Inventory, InventoryDocument } from './schemas/inventory.schema';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
  ) {}

  async decrementStock(productId: string, quantity: number): Promise<void> {
    const updated = await this.inventoryModel.findOneAndUpdate(
      { productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { returnDocument: 'after' },
    );

    if (!updated) {
      this.logger.warn(`Insufficient stock or product not found: ${productId}`);
      return;
    }

    this.logger.log(
      `Stock decremented — product: ${productId}, by: ${quantity}, remaining: ${updated.stock}`,
    );
  }
}