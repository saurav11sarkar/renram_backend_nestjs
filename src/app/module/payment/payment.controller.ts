import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto/create-payment.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('payment')
@ApiTags('Payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('user'))
  @ApiBearerAuth('access-token')
  async checkout(@Req() req: Request, @Body() dto: CreateCheckoutDto) {
    const userId = req.user!.id;
    return this.paymentService.createCheckoutSession(userId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('user', 'admin'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Retrieve all payments for the authenticated user or admin',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Search term for filtering payments',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Status filter for payments',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort order (asc or desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        meta: { type: 'object' },
        data: { type: 'array' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAll(@Req() req: Request) {
    const userId = req.user!.id;
    const filters = pick(req.query, ['searchTerm', 'status']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.paymentService.getAllPaymet(
      userId,
      filters,
      options,
    );
    return {
      message: 'Payment retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSinglePayment(@Param('id') id: string) {
    const reasult = await this.paymentService.getSinglePayment(id);
    return {
      message: 'Payment retrieved successfully',
      data: reasult,
    };
  }
}
