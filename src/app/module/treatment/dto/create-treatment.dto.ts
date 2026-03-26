import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TreatmentQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  score?: number;
}

export class TreatmentQuestionDto {
  @IsString()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsString()
  answare?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentQuestionOptionDto)
  optionWeights?: TreatmentQuestionOptionDto[];
}

export class CreateTreatmentDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentQuestionDto)
  treatmentQuestions?: TreatmentQuestionDto[];

  @IsOptional()
  @IsMongoId()
  createBy?: string;
}
