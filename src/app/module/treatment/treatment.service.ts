import { HttpException, Injectable } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Treatment, TreatmentDocment } from './entities/treatment.entity';
import { Model } from 'mongoose';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectModel(Treatment.name)
    private readonly treatmentModel: Model<TreatmentDocment>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async createTreatment(
    userId: string,
    createTreatmentDto: CreateTreatmentDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);
    const result = await this.treatmentModel.create({
      ...createTreatmentDto,
      createBy: user._id,
    });
    if (!result) throw new HttpException('treatment create faild', 500);
    return result;
  }

  async getAllTreatment(params: IFilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['name', 'description', 'category'];

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

    const result = await this.treatmentModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit)
      .populate(
        'createBy',
        'firstName lastName profilePicture email phoneNumber',
      );
    const total = await this.treatmentModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async getSingleTreatment(id: string) {
    const result = await this.treatmentModel.findById(id);
    if (!result) throw new HttpException('treatment not found', 404);
    return result;
  }

  async updateTreatment(
    userId: string,
    id: string,
    updateTreatmentDto: UpdateTreatmentDto,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);

    const isExist = await this.treatmentModel.findById(id);
    if (!isExist) throw new HttpException('treatment not found', 404);

    if (isExist.createBy.toString() !== user._id.toString()) {
      throw new HttpException('not authorized', 403);
    }

    const result = await this.treatmentModel.findByIdAndUpdate(
      id,
      updateTreatmentDto,
      {
        new: true,
      },
    );
    if (!result) throw new HttpException('treatment update failed', 500);
    return result;
  }

  async deleteTreatment(userId: string, id: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('user not found', 404);
    const isExist = await this.treatmentModel.findById(id);

    if (!isExist) throw new HttpException('treatment not found', 404);
    if (isExist.createBy.toString() !== user._id.toString()) {
      throw new HttpException('not authorized', 403);
    }
    const result = await this.treatmentModel.findByIdAndDelete(id);
    if (!result) throw new HttpException('treatment delete failed', 500);
    return result;
  }
}
