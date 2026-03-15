import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateAddtocartDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}
