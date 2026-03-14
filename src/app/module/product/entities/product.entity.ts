import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, trim: true })
  whatWillYouGet: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [String], default: [] })
  size: string[];

  @Prop({ type: [String], default: [] })
  image: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createBy: Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  byeUsers: Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }] })
  reviews: Types.ObjectId[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
