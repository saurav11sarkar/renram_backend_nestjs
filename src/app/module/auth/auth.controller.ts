import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import type { Request, Response } from 'express';
import AuthGuard from 'src/app/middlewares/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createAuthDto: CreateAuthDto) {
    const result = await this.authService.register(createAuthDto);

    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() createAuthDto: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(createAuthDto, res);

    return {
      message: 'User logged in successfully',
      data: result,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() createAuthDto: { email: string }) {
    const result = await this.authService.forgotPassword(createAuthDto.email);

    return {
      message: 'Email sent successfully',
      data: result,
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() createAuthDto: { email: string; otp: string }) {
    const result = await this.authService.verifyEmail(
      createAuthDto.email,
      createAuthDto.otp,
    );
    return {
      message: 'Email verified successfully',
      data: result,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPasswordChange(
    @Body() CreateAuthDto: { email: string; newPassword: string },
  ) {
    const result = await this.authService.resetPasswordChange(
      CreateAuthDto.email,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('user', 'admin'))
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() CreateAuthDto: { oldPassword: string; newPassword: string },
    @Req() req: Request,
  ) {
    console.log(req.user!.id);
    const result = await this.authService.changePassword(
      req.user!.id,
      CreateAuthDto.oldPassword,
      CreateAuthDto.newPassword,
    );
    return {
      message: 'Password changed successfully',
      data: result,
    };
  }
}
