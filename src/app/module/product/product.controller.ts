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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/app/helper/fileUploder';
import AuthGuard from 'src/app/middlewares/auth.guard';
import pick from 'src/app/helper/pick';

@Controller('product')
@ApiTags('Product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create product with multiple image upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'description', 'price'],
      properties: {
        name: { type: 'string', example: 'Hair Growth Oil' },
        description: {
          type: 'string',
          example: 'Supports healthy hair growth and scalp care',
        },
        whatWillYouGet: {
          type: 'string',
          example: '1 bottle oil, usage guide',
        },
        price: { type: 'number', example: 1200 },
        size: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
              example: ['100ml', '200ml'],
            },
            {
              type: 'string',
              example: '100ml,200ml',
            },
          ],
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get all products with search, filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'oil',
    description: 'Search by product name, description, whatWillYouGet, or size',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Hair Growth Oil',
    description: 'Filter by exact product name',
  })
  @ApiQuery({
    name: 'description',
    required: false,
    type: String,
    example: 'Supports healthy hair growth',
    description: 'Filter by exact description value',
  })
  @ApiQuery({
    name: 'whatWillYouGet',
    required: false,
    type: String,
    example: 'usage guide',
    description: 'Filter by exact whatWillYouGet value',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: String,
    example: '100ml',
    description: 'Filter by size value',
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
  @ApiOperation({ summary: 'Get single product by id' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
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
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update product with optional multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Hair Growth Oil' },
        description: {
          type: 'string',
          example: 'Updated product description',
        },
        whatWillYouGet: {
          type: 'string',
          example: '1 bottle oil, usage guide',
        },
        price: { type: 'number', example: 1200 },
        size: {
          oneOf: [
            {
              type: 'array',
              items: { type: 'string' },
              example: ['100ml', '200ml'],
            },
            {
              type: 'string',
              example: '100ml,200ml',
            },
          ],
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, fileUpload.uploadConfig))
  @HttpCode(HttpStatus.OK)
  async updateProduct(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user!.id;

    const result = await this.productService.updateProduct(
      userId,
      id,
      updateProductDto,
      files,
    );

    return {
      message: 'Product updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async deleteProduct(@Param('id') id: string) {
    const result = await this.productService.deleteProduct(id);

    return {
      message: 'Product deleted successfully',
      data: result,
    };
  }
}
