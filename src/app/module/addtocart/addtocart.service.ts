import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAddtocartDto } from './dto/create-addtocart.dto';
import { UpdateAddtocartDto } from './dto/update-addtocart.dto';
import { Addtocart, AddtocartDocument } from './entities/addtocart.entity';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AddtocartService {
  constructor(
    @InjectModel(Addtocart.name)
    private readonly addtocartModel: Model<AddtocartDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createAddtocart(userId: string, createAddtocartDto: CreateAddtocartDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);

    const product = await this.productModel.findById(createAddtocartDto.productId);
    if (!product) throw new HttpException('Product is not found', 404);

    const existingCartItem = await this.addtocartModel.findOne({
      user: user._id,
      product: product._id,
    });

    if (existingCartItem) {
      existingCartItem.quantity += createAddtocartDto.quantity;
      await existingCartItem.save();
      return this.getSingleAddtocart(userId, existingCartItem._id.toString());
    }

    const result = await this.addtocartModel.create({
      user: user._id,
      product: product._id,
      quantity: createAddtocartDto.quantity,
    });

    return this.getSingleAddtocart(userId, result._id.toString());
  }

  async getMyAddtocart(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);

    const result = await this.addtocartModel
      .find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('product')
      .populate('user', 'firstName lastName email profilePicture phoneNumber');

    const totalItems = result.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items: result,
      totalItems,
    };
  }

  async getSingleAddtocart(userId: string, id: string) {
    const result = await this.addtocartModel
      .findOne({ _id: id, user: userId })
      .populate('product')
      .populate('user', 'firstName lastName email profilePicture phoneNumber');

    if (!result) throw new HttpException('Cart item is not found', 404);

    return result;
  }

  async updateAddtocart(
    userId: string,
    id: string,
    updateAddtocartDto: UpdateAddtocartDto,
  ) {
    const cartItem = await this.addtocartModel.findOne({ _id: id, user: userId });
    if (!cartItem) throw new HttpException('Cart item is not found', 404);

    const result = await this.addtocartModel.findByIdAndUpdate(
      id,
      updateAddtocartDto,
      { new: true },
    );

    if (!result) throw new HttpException('Cart item is not found', 404);

    return this.getSingleAddtocart(userId, result._id.toString());
  }

  async removeAddtocart(userId: string, id: string) {
    const result = await this.addtocartModel.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!result) throw new HttpException('Cart item is not found', 404);

    return result;
  }

  async clearMyAddtocart(userId: string) {
    await this.userModel.findById(userId).orFail(
      () => new HttpException('User is not found', 404),
    );

    const result = await this.addtocartModel.deleteMany({ user: userId });

    return {
      deletedCount: result.deletedCount,
    };
  }
}
