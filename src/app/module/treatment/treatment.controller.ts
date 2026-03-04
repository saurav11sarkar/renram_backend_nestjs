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
import { TreatmentService } from './treatment.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
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
  async getSingleTreatment(@Param('id') id: string) {
    const result = await this.treatmentService.getSingleTreatment(id);

    return { message: 'Treatment retrieved successfully', data: result };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
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
