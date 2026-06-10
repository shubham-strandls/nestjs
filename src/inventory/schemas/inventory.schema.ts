import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InventoryDocument = HydratedDocument<Inventory>;

@Schema({ timestamps: true, collection: 'inventory' })
export class Inventory {
  @Prop({ required: true, unique: true })
  productId: string;

  @Prop({ required: true, min: 0 })
  stock: number;
}

export const InventorySchema = SchemaFactory.createForClass(Inventory);