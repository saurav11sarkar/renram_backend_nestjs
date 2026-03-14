import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/app/helper/fileUploder';
import type { Request } from 'express';
import pick from 'src/app/helper/pick';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.userService.createUser(createUserDto, file);

    return {
      message: 'User is create successfully',
      data: result,
    };
  }

  @Get('all-users')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all users with search, filters, pagination, and sorting',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'saurav',
    description:
      'Search by firstName, lastName, phoneNumber, email, role, address, or gender',
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    type: String,
    example: 'Saurav',
    description: 'Filter by first name',
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
    type: String,
    example: 'Das',
    description: 'Filter by last name',
  })
  @ApiQuery({
    name: 'phoneNumber',
    required: false,
    type: String,
    example: '01700000000',
    description: 'Filter by phone number',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    example: 'saurav@example.com',
    description: 'Filter by email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    example: 'user',
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'address',
    required: false,
    type: String,
    example: 'Dhaka',
    description: 'Filter by address',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    type: String,
    example: 'male',
    description: 'Filter by gender',
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
  async findAllUsers(@Req() req: Request) {
    const filters = pick(req.query, [
      'searchTerm',
      'firstName',
      'lastName',
      'phoneNumber',
      'email',
      'role',
      'address',
      'gender',
    ]);

    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.userService.getAllUsers(filters, options);
    return {
      message: 'All users retrieved successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard('user', 'admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async findProfile(@Req() req: Request) {
    const result = await this.userService.getProfile(req.user!.id);
    return {
      message: 'User profile retrieved successfully',
      data: result,
    };
  }

  @Put('profile')
  @UseGuards(AuthGuard('user', 'admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.userService.updateUserInfo(
      req.user!.id,
      updateUserDto,
      file,
    );
    return {
      message: 'User profile updated successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single user by id' })
  @ApiParam({
    name: 'id',
    type: String,
    example: '67d3f5d5a3c1c82c1d123456',
  })
  @HttpCode(HttpStatus.OK)
  async findSingleUser(@Param('id') id: string) {
    const result = await this.userService.getSingleUser(id);
    return {
      message: 'User retrieved successfully',
      data: result,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePicture', fileUpload.uploadConfig))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log(UpdateUserDto);
    const result = await this.userService.updateUserInfo(
      id,
      updateUserDto,
      file,
    );
    return {
      message: 'User updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      data: result,
    };
  }
}
