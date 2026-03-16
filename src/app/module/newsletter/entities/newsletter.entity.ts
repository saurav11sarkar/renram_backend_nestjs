import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NewsletterDocument = HydratedDocument<Newsletter>;

@Schema({ timestamps: true })
export class Newsletter {
  @Prop()
  email: string;
}

export const NewsletterSchema = SchemaFactory.createForClass(Newsletter);
