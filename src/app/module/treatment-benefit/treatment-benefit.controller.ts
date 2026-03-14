import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TreatmentBenefitService } from './treatment-benefit.service';
import { CreateTreatmentBenefitDto } from './dto/create-treatment-benefit.dto';
import { UpdateTreatmentBenefitDto } from './dto/update-treatment-benefit.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('treatment-benefit')
@ApiTags('Treatment Benefit')
export class TreatmentBenefitController {
  constructor(
    private readonly treatmentBenefitService: TreatmentBenefitService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async createTreatmentBenefit(
    @Req() req: Request,
    @Body() createTreatmentBenefitDto: CreateTreatmentBenefitDto,
  ) {
    const result = await this.treatmentBenefitService.createTreatmentBenefit(
      req.user!.id,
      createTreatmentBenefitDto,
    );

    return { message: 'Treatment benefit created successfully', data: result };
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all treatment benefits with search, filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'hair',
    description: 'Search by title, description, or category',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Hair Benefit',
    description: 'Filter by exact name field if stored in data',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    example: 'Improves scalp condition',
    description: 'Filter by exact description value',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: 'hair-care',
    description: 'Filter by exact category',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number. Default is 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page. Default is 10',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  async getAllTreatmentBenefit(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'description',
      'category',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.treatmentBenefitService.getAllTreatmentBenefit(
      filters,
      options,
    );

    return {
      message: 'Treatment benefit retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single treatment benefit by id' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  async getSingleTreatmentBenefit(@Param('id') id: string) {
    const result =
      await this.treatmentBenefitService.getSingleTreatmentBenefit(id);

    return {
      message: 'Treatment benefit retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async updateTreatmentBenefit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTreatmentBenefitDto: UpdateTreatmentBenefitDto,
  ) {
    const result = await this.treatmentBenefitService.updateTreatmentBenefit(
      req.user!.id,
      id,
      updateTreatmentBenefitDto,
    );

    return {
      message: 'Treatment benefit updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async deleteTreatmentBenefit(@Req() req: Request, @Param('id') id: string) {
    const result = await this.treatmentBenefitService.deleteTreatmentBenefit(
      req.user!.id,
      id,
    );

    return {
      message: 'Treatment benefit deleted successfully',
      data: result,
    };
  }
}
