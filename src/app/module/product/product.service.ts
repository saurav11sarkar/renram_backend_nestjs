import { HttpException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './entities/product.entity';
import { User, UserDocument } from '../user/entities/user.entity';
import { Model } from 'mongoose';
import { fileUpload } from 'src/app/helper/fileUploder';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createProduct(
    userId: string,
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);

    if (files?.length) {
      const productImages = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file)),
      );
      createProductDto.image = productImages.map((img) => img.url);
    }

    const result = await this.productModel.create({
      ...createProductDto,
      createBy: user._id,
    });

    return result;
  }

  async getAllProduct(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['name', 'description', 'whatWillYouGet', 'size'];

    if (searchTerm) {
      andCondition.push({
        $or: searchAbleFields.map((field) => ({
          [field]: {
            $regex: searchTerm,
            $options: 'i',
          },
        })),
      });
    }

    if (Object.keys(filterData).length > 0) {
      andCondition.push({
        $and: Object.entries(filterData).map(([key, value]) => ({
          [key]: value,
        })),
      });
    }

    const whereConditions =
      andCondition.length > 0 ? { $and: andCondition } : {};

    const result = await this.productModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit)
      .populate(
        'createBy',
        'firstName lastName profilePicture email phoneNumber',
      );
    const total = await this.productModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleProduct(id: string) {
    const result = await this.productModel
      .findById(id)
      .populate(
        'createBy',
        'firstName lastName profilePicture email phoneNumber',
      );
    if (!result) throw new HttpException('Product is not found', 404);
    return result;
  }

  async updateProduct(
    userId: string,
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
    const product = await this.productModel.findById(id);
    if (!product) throw new HttpException('Product is not found', 404);

    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User is not found', 404);

    if (product.createBy.toString() !== user._id.toString()) {
      throw new HttpException(
        'You are not authorized to update this product',
        403,
      );
    }

    if (files?.length) {
      const productImages = await Promise.all(
        files.map((file) => fileUpload.uploadToCloudinary(file)),
      );
      updateProductDto.image = productImages.map((img) => img.url);
    }

    const result = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      {
        new: true,
      },
    );
    return result;
  }

  async deleteProduct(id: string) {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) throw new HttpException('Product is not found', 404);
    return result;
  }
}
