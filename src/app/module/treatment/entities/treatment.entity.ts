import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentDocment = HydratedDocument<Treatment>;

@Schema({ timestamps: true })
export class Treatment {
  @Prop()
  name: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop({
    type: [
      {
        question: {
          type: String,
        },
        options: { type: [String] },
        answare: { type: String },
      },
    ],
    default: [],
  })
  treatmentQuestions: {
    question: string;
    options: string[];
    answare?: string;
  }[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createBy: Types.ObjectId;
}

export const TreatmentSchema = SchemaFactory.createForClass(Treatment);
