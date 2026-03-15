import { Module } from '@nestjs/common';
import { AddtocartService } from './addtocart.service';
import { AddtocartController } from './addtocart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Addtocart, AddtocartSchema } from './entities/addtocart.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { User, UserSchema } from '../user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Addtocart.name, schema: AddtocartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AddtocartController],
  providers: [AddtocartService],
})
export class AddtocartModule {}
