import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('contact')
@ApiTags('Contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContact(@Body() createContactDto: CreateContactDto) {
    const result = await this.contactService.createContact(createContactDto);

    return {
      message: 'Contact create successfully',
      data: result,
    };
  }

  @Get()
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all contacts with search, filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'support',
    description: 'Search by name, message, email, or phone number',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    example: 'Saurav',
    description: 'Filter by exact name',
  })
  @ApiQuery({
    name: 'message',
    required: false,
    type: String,
    example: 'Need help with order',
    description: 'Filter by exact message',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    example: 'saurav@example.com',
    description: 'Filter by exact email',
  })
  @ApiQuery({
    name: 'phoneNumber',
    required: false,
    type: String,
    example: '01700000000',
    description: 'Filter by exact phone number',
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
  async getAllContact(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'name',
      'message',
      'email',
      'phoneNumber',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.contactService.getAllContact(filters, options);

    return {
      message: 'Contact retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single contact by id' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  @HttpCode(HttpStatus.OK)
  async getSingleContact(@Param('id') id: string) {
    const result = await this.contactService.getSingleContact(id);
    return {
      message: 'Contact retrieved successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  deleteContact(@Param('id') id: string) {
    const result = this.contactService.deleteContact(id);

    return {
      message: 'Contact deleted successfully',
      data: result,
    };
  }
}
