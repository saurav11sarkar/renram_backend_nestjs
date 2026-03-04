import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Product category is required' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'Product description is required' })
  description: string;

  @IsString()
  @IsOptional()
  whatWillYouGet: string;

  @IsNumber()
  @Min(0, { message: 'Price must be a positive number' })
  @IsNotEmpty()
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each image must be a string URL' })
  image?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch (e) {
          // JSON parse failed, continue with string split
        }
      }

      return trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  })
  size?: string[];
}
