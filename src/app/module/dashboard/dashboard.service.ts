import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from '../product/entities/product.entity';

import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../payment/entities/payment.entity';

export type RangeType = 'week' | 'year';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async getDashboardData() {
    const totalProducts = await this.productModel.countDocuments();
    const totalSales = await this.paymentModel.aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const sales =
      totalSales.length > 0 ? totalSales[0] : { totalAmount: 0, totalCount: 0 };

    return {
      totalProducts,
      totalSales: sales.totalAmount,
      totalOrders: sales.totalCount,
    };
  }

  async getSalesReport(range: RangeType, year?: number) {
    if (range === 'week') return this.getWeeklyReport();
    if (range === 'year') return this.getYearlyReport(year);

    throw new BadRequestException('range must be week or year');
  }

  // WEEK: Sunday -> Saturday (this week vs last week)
  private async getWeeklyReport() {
    const now = new Date();

    // Start of current week (Sunday 00:00)
    const day = now.getDay(); // 0=Sunday
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - day);
    startOfThisWeek.setHours(0, 0, 0, 0);

    // End of this week (next Sunday 00:00) => [start, end)
    const endOfThisWeek = new Date(startOfThisWeek);
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 7);

    // Last week range
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const endOfLastWeek = new Date(endOfThisWeek);
    endOfLastWeek.setDate(endOfThisWeek.getDate() - 7);

    const thisWeek = await this.aggregateByDayOfWeek(
      startOfThisWeek,
      endOfThisWeek,
    );
    const lastWeek = await this.aggregateByDayOfWeek(
      startOfLastWeek,
      endOfLastWeek,
    );

    return {
      range: 'week',
      labels: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
      thisPeriod: thisWeek,
      lastPeriod: lastWeek,
      totals: {
        thisPeriodTotal: thisWeek.reduce((a, b) => a + b, 0),
        lastPeriodTotal: lastWeek.reduce((a, b) => a + b, 0),
      },
    };
  }

  // YEAR: Jan -> Dec (selected year vs previous year)
  private async getYearlyReport(selectedYear?: number) {
    const year = selectedYear || new Date().getFullYear();

    if (!Number.isInteger(year) || year < 1970 || year > 3000) {
      throw new BadRequestException('year must be a valid number like 2025');
    }

    const startThisYear = new Date(year, 0, 1, 0, 0, 0, 0);
    const endThisYear = new Date(year + 1, 0, 1, 0, 0, 0, 0);

    const startLastYear = new Date(year - 1, 0, 1, 0, 0, 0, 0);
    const endLastYear = new Date(year, 0, 1, 0, 0, 0, 0);

    const thisYear = await this.aggregateByMonth(startThisYear, endThisYear);
    const lastYear = await this.aggregateByMonth(startLastYear, endLastYear);

    return {
      range: 'year',
      year,
      labels: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
      thisPeriod: thisYear,
      lastPeriod: lastYear,
      totals: {
        thisPeriodTotal: thisYear.reduce((a, b) => a + b, 0),
        lastPeriodTotal: lastYear.reduce((a, b) => a + b, 0),
      },
    };
  }

  // -------------------- HELPERS --------------------
  // Returns array[7] => Sunday..Saturday
  private async aggregateByDayOfWeek(
    start: Date,
    end: Date,
  ): Promise<number[]> {
    const data = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' }, // 1=Sunday ... 7=Saturday
          total: { $sum: '$amount' },
        },
      },
    ]);

    const result = Array(7).fill(0);

    for (const item of data) {
      const idx = item._id - 1; // 0..6
      if (idx >= 0 && idx < 7) result[idx] = item.total;
    }

    return result;
  }

  // Returns array[12] => Jan..Dec
  private async aggregateByMonth(start: Date, end: Date): Promise<number[]> {
    const data = await this.paymentModel.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' }, // 1..12
          total: { $sum: '$amount' },
        },
      },
    ]);

    const result = Array(12).fill(0);

    for (const item of data) {
      const idx = item._id - 1; // 0..11
      if (idx >= 0 && idx < 12) result[idx] = item.total;
    }

    return result;
  }
}
