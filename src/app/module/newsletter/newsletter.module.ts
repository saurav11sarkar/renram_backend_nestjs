import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Newsletter, NewsletterSchema } from './entities/newsletter.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Newsletter.name, schema: NewsletterSchema },
    ]),
  ],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
