import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreatebroadcastNewsletter,
  CreateNewsletterDto,
} from './dto/create-newsletter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Newsletter, NewsletterDocument } from './entities/newsletter.entity';
import { Model } from 'mongoose';
import sendMailer from 'src/app/helper/sendMailer';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(Newsletter.name)
    private readonly newsletterModel: Model<NewsletterDocument>,
  ) {}

  async createNewsletter(createNewsletterDto: CreateNewsletterDto) {
    const email = createNewsletterDto.email.trim().toLowerCase();

    const existingSubscriber = await this.newsletterModel.findOne({ email });
    if (existingSubscriber) {
      throw new ConflictException('Email is already subscribed');
    }

    const result = await this.newsletterModel.create({ email });

    return result;
  }

  async broadcastNewsletter(
    createbroadcastNewsletter: CreatebroadcastNewsletter,
  ) {
    const { subject, html } = createbroadcastNewsletter;
    if (!subject?.trim() || !html?.trim()) {
      throw new BadRequestException('Subject and HTML content are required');
    }

    const newsletter = await this.newsletterModel.find();
    if (!newsletter.length) {
      throw new NotFoundException('No newsletter subscribers found');
    }

    await Promise.all(
      newsletter.map(async (sub) =>
        sendMailer(sub.email, subject, html).catch((err) =>
          console.error(`❌ Failed to send email to ${sub.email}:`, err),
        ),
      ),
    );

    return {
      message: 'Newsletter broadcasted successfully',
      count: newsletter.length,
    };
  }
}
