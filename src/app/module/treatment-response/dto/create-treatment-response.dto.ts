import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  question: string;

  @IsString()
  selectedAnswer: string;
}

export class CreateTreatmentResponseDto {
  @IsOptional()
  @IsMongoId()
  treatmentBenefit?: string;

  // Keep accepting the legacy field name to avoid breaking existing clients.
  @IsOptional()
  @IsMongoId()
  treatment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
