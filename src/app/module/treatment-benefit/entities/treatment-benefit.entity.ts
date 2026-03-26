import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentBenefitDocment = HydratedDocument<TreatmentBenefit>;

@Schema({ timestamps: true })
export class TreatmentBenefit {
  @Prop()
  title: string;

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
        optionWeights: {
          type: [
            {
              label: { type: String },
              score: { type: Number, min: 1, max: 7, default: 1 },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  })
  treatmentQuestions: {
    question: string;
    options: string[];
    answare?: string;
    optionWeights?: {
      label: string;
      score: number;
    }[];
  }[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createBy: Types.ObjectId;
}

export const TreatmentBenefitSchema =
  SchemaFactory.createForClass(TreatmentBenefit);
