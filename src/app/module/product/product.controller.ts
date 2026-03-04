import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/app/helper/fileUploder';
import AuthGuard from 'src/app/middlewares/auth.guard';
import pick from 'src/app/helper/pick';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FilesInterceptor('images', 10, fileUpload.uploadConfig))
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Req() req: Request,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user!.id;

    const result = await this.productService.createProduct(
      userId,
      createProductDto,
      files,
    );

    return {
      message: 'Product create successfully',
      data: result,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllProducts(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'description',
      'whatWillYouGet',
      'size',
      'category',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.productService.getAllProduct(filters, options);
    return {
      message: 'Product fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSingleProduct(@Param('id') id: string) {
    const result = await this.productService.getSingleProduct(id);
    return {
      message: 'Product fetched successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @UseInterceptors(FilesInterceptor('images', 10, fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateProduct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const userId = req.user!.id;

    const result = await this.productService.updateProduct(
      userId,
      id,
      updateProductDto,
    );

    return {
      message: 'Product updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id') id: string) {
    const result = await this.productService.deleteProduct(id);

    return {
      message: 'Product deleted successfully',
      data: result,
    };
  }
}
