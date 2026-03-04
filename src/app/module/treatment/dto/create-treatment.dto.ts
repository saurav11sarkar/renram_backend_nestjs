import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TreatmentQuestionDto {
  @IsString()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsString()
  answare?: string;
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
