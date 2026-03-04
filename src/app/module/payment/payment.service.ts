import { HttpException, Injectable } from '@nestjs/common';
import { CreateCheckoutDto, CreatePaymentDto } from './dto/create-payment.dto';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './entities/payment.entity';
import Stripe from 'stripe';
import config from 'src/app/config';
import { IFilterParams } from 'src/app/helper/pick';
import paginationHelper, { IOptions } from 'src/app/helper/pagenation';
import { User, UserDocument } from '../user/entities/user.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    this.stripe = new Stripe(config.stripe.secretKey!);
  }

  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productModel.find({ _id: { $in: productIds } });

    if (!products.length) throw new HttpException('No products found', 400);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let total = 0;

    const itemsSnapshot = dto.items.map((i) => {
      const p = products.find((x) => x._id.toString() === i.productId);
      if (!p) throw new HttpException(`Invalid product: ${i.productId}`, 400);

      total += p.price * i.qty;

      line_items.push({
        quantity: i.qty,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(p.price * 100), // dollars->cents
          product_data: {
            name: p.name,
            description: p.description,
            images: p.image?.length ? [p.image[0]] : undefined,
          },
        },
      });

      return {
        product: p._id,
        qty: i.qty,
        size: i.size,
        price: p.price,
      };
    });

    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(userId),
      items: itemsSnapshot,
      amount: total,
      currency: 'usd',
      status: 'pending',
      paymentType: 'product',
    });

    // 3) create stripe session
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${config.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payment-faild`,
      metadata: {
        paymentId: payment._id.toString(),
        paymentType: 'product',
      },
    });

    payment.stripeSessionId = session.id;
    await payment.save();

    return { url: session.url, sessionId: session.id };
  }

  async getAllPaymet(userId: string, params: IFilterParams, options: IOptions) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);
    const { limit, page, skip, sortBy, sortOrder } = paginationHelper(options);
    const { searchTerm, ...filterData } = params;

    const andCondition: any[] = [];
    const searchAbleFields = ['status', 'paymentType', 'currency'];

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
    if (user.role !== 'admin') {
      andCondition.push({
        user: user._id,
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

    const result = await this.paymentModel
      .find(whereConditions)
      .sort({ [sortBy]: sortOrder } as any)
      .skip(skip)
      .limit(limit);

    const total = await this.paymentModel.countDocuments(whereConditions);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
      },
    };
  }
}
