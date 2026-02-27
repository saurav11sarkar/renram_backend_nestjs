import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import AuthGuard from 'src/app/middlewares/auth.guard';

export type RangeType = 'week' | 'year';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getDashboardData() {
    const result = await this.dashboardService.getDashboardData();

    return {
      message: 'Data retrieved successfully',
      data: result,
    };
  }

  @Get('sales-report')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async getSalesReport(
    @Query('range') range: RangeType,
    @Query('year') year?: string,
  ) {
    const parsedYear = year ? Number(year) : undefined;
    const data = await this.dashboardService.getSalesReport(
      range || 'week',
      parsedYear,
    );

    return {
      message: 'Sales report retrieved successfully',
      data,
    };
  }
}
