import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AddtocartDocument = HydratedDocument<Addtocart>;

@Schema({ timestamps: true })
export class Addtocart {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
    default: 1,
  })
  quantity: number;
}

export const AddtocartSchema = SchemaFactory.createForClass(Addtocart);

AddtocartSchema.index({ user: 1, product: 1 }, { unique: true });
