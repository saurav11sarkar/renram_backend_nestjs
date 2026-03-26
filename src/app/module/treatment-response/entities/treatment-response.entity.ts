import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentResponseDocument = HydratedDocument<TreatmentResponse>;

@Schema({ timestamps: true })
export class TreatmentResponse {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TreatmentBenefit',
  })
  treatmentBenefit?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
  })
  treatment?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        question: { type: String },
        selectedAnswer: { type: String },
        score: { type: Number, default: 0 },
        matchLevel: { type: String },
      },
    ],
    default: [],
  })
  answers: {
    question: string;
    selectedAnswer: string;
    score: number;
    matchLevel: string;
  }[];

  @Prop({ default: 0 })
  totalQuestions: number;

  @Prop({ default: 0 })
  totalScore: number;

  @Prop({ default: 0 })
  averageScore: number;

  @Prop({ default: 0 })
  matchPercentage: number;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({
    type: {
      level: { type: String },
      statusBadge: { type: String },
      title: { type: String },
      text: { type: String },
    },
    default: null,
  })
  resultSummary: {
    level: string;
    statusBadge: string;
    title: string;
    text: string;
  };
}

export const TreatmentResponseSchema =
  SchemaFactory.createForClass(TreatmentResponse);
