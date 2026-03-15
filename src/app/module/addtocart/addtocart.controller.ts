import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { AddtocartService } from './addtocart.service';
import { CreateAddtocartDto } from './dto/create-addtocart.dto';
import { UpdateAddtocartDto } from './dto/update-addtocart.dto';

@Controller('addtocart')
@ApiTags('Add To Cart')
@UseGuards(AuthGuard('user', 'admin'))
@ApiBearerAuth('access-token')
export class AddtocartController {
  constructor(private readonly addtocartService: AddtocartService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAddtocart(
    @Req() req: Request,
    @Body() createAddtocartDto: CreateAddtocartDto,
  ) {
    const userId = req.user!.id;
    const result = await this.addtocartService.createAddtocart(
      userId,
      createAddtocartDto,
    );

    return {
      message: 'Product added to cart successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user cart items' })
  @HttpCode(HttpStatus.OK)
  async getMyAddtocart(@Req() req: Request) {
    const userId = req.user!.id;
    const result = await this.addtocartService.getMyAddtocart(userId);

    return {
      message: 'Cart retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  @HttpCode(HttpStatus.OK)
  async getSingleAddtocart(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!.id;
    const result = await this.addtocartService.getSingleAddtocart(userId, id);

    return {
      message: 'Cart item retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  @HttpCode(HttpStatus.OK)
  async updateAddtocart(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAddtocartDto: UpdateAddtocartDto,
  ) {
    const userId = req.user!.id;
    const result = await this.addtocartService.updateAddtocart(
      userId,
      id,
      updateAddtocartDto,
    );

    return {
      message: 'Cart item updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  @HttpCode(HttpStatus.OK)
  async removeAddtocart(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user!.id;
    const result = await this.addtocartService.removeAddtocart(userId, id);

    return {
      message: 'Cart item removed successfully',
      data: result,
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearMyAddtocart(@Req() req: Request) {
    const userId = req.user!.id;
    const result = await this.addtocartService.clearMyAddtocart(userId);

    return {
      message: 'Cart cleared successfully',
      data: result,
    };
  }
}
