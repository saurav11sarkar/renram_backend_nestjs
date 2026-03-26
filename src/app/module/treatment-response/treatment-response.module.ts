import { Module } from '@nestjs/common';
import { TreatmentResponseService } from './treatment-response.service';
import { TreatmentResponseController } from './treatment-response.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TreatmentResponse,
  TreatmentResponseSchema,
} from './entities/treatment-response.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import {
  TreatmentBenefit,
  TreatmentBenefitSchema,
} from '../treatment-benefit/entities/treatment-benefit.entity';
import { Treatment, TreatmentSchema } from '../treatment/entities/treatment.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TreatmentBenefit.name, schema: TreatmentBenefitSchema },
      { name: Treatment.name, schema: TreatmentSchema },
      { name: Product.name, schema: ProductSchema },
      { name: TreatmentResponse.name, schema: TreatmentResponseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TreatmentResponseController],
  providers: [TreatmentResponseService],
})
export class TreatmentResponseModule {}
