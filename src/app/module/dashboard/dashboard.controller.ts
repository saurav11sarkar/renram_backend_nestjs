import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import AuthGuard from 'src/app/middlewares/auth.guard';

export type RangeType = 'week' | 'year';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
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
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get sales report by week or by year',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['week', 'year'],
    example: 'week',
    description: 'Report range. Use week or year',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    example: 2026,
    description: 'Required when range=year',
  })
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
