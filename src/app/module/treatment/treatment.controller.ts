import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TreatmentService } from './treatment.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('treatment')
@ApiTags('Treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async createTreatment(
    @Req() req: Request,
    @Body() createTreatmentDto: CreateTreatmentDto,
  ) {
    const result = await this.treatmentService.createTreatment(
      req.user!.id,
      createTreatmentDto,
    );

    return { message: 'Treatment created successfully', data: result };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all treatments with search, filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: '',
    description: 'Search by treatment name, description, or category',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: '',
    description: 'Filter by exact treatment name',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    example: '',
    description: 'Filter by exact description value',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    example: '',
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
    example: '',
    description: 'Sort field. Default is createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order. Default is desc',
  })
  async getAllTreatment(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'description',
      'category',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.treatmentService.getAllTreatment(
      filters,
      options,
    );

    return {
      message: 'Treatment retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single treatment by id' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  async getSingleTreatment(@Param('id') id: string) {
    const result = await this.treatmentService.getSingleTreatment(id);

    return { message: 'Treatment retrieved successfully', data: result };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async updateTreatment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    const result = await this.treatmentService.updateTreatment(
      req.user!.id,
      id,
      updateTreatmentDto,
    );

    return {
      message: 'Treatment updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async deleteTreatment(@Req() req: Request, @Param('id') id: string) {
    const result = await this.treatmentService.deleteTreatment(
      req.user!.id,
      id,
    );

    return {
      message: 'Treatment deleted successfully',
      data: result,
    };
  }
}
