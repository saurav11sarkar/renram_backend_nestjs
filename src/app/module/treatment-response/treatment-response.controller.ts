import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TreatmentResponseService } from './treatment-response.service';
import { CreateTreatmentResponseDto } from './dto/create-treatment-response.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';

@Controller('treatment-response')
@ApiTags('Treatment Response')
export class TreatmentResponseController {
  constructor(
    private readonly treatmentResponseService: TreatmentResponseService,
  ) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: CreateTreatmentResponseDto) {
    const result = await this.treatmentResponseService.previewResponse(dto);

    return {
      message: 'Treatment benefit preview generated successfully',
      data: result,
    };
  }

  @Post()
  @UseGuards(AuthGuard('user'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async submit(@Req() req: Request, @Body() dto: CreateTreatmentResponseDto) {
    const result = await this.treatmentResponseService.submitResponse(
      req.user!.id,
      dto,
    );

    return {
      message: 'Treatment benefit submitted successfully',
      data: result,
    };
  }

  @Get('my-dashboard')
  @UseGuards(AuthGuard('user'))
  @ApiBearerAuth('access-token')
  async myDashboard(@Req() req: Request) {
    const result = await this.treatmentResponseService.myDashboard(
      req.user!.id,
    );

    return {
      message: 'Dashboard retrieved successfully',
      data: result,
    };
  }
}
