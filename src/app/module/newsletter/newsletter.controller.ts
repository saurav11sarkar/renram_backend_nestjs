import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import {
  CreatebroadcastNewsletter,
  CreateNewsletterDto,
} from './dto/create-newsletter.dto';
import AuthGuard from 'src/app/middlewares/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async createNewsletter(@Body() createNewsletterDto: CreateNewsletterDto) {
    const result =
      await this.newsletterService.createNewsletter(createNewsletterDto);

    return {
      message: 'Newsletter created successfully',
      data: result,
    };
  }

  @Post('broadcast')
  @UseGuards(AuthGuard('admin'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async broadcastNewsletter(
    @Body() createbroadcastNewsletter: CreatebroadcastNewsletter,
  ) {
    const result = await this.newsletterService.broadcastNewsletter(
      createbroadcastNewsletter,
    );

    return {
      message: 'Newsletter broadcasted successfully',
      data: result,
    };
  }
}
