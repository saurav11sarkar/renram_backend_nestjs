import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/module/user/user.module';
import { AuthModule } from './app/module/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import config from './app/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './app/module/product/product.module';
import { WebhookModule } from './app/module/webhook/webhook.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { TreatmentModule } from './app/module/treatment/treatment.module';
import { ContactModule } from './app/module/contact/contact.module';
import { ReviewModule } from './app/module/review/review.module';
import { TreatmentResponseModule } from './app/module/treatment-response/treatment-response.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { TreatmentBenefitModule } from './app/module/treatment-benefit/treatment-benefit.module';
import { AddtocartModule } from './app/module/addtocart/addtocart.module';
import { NewsletterModule } from './app/module/newsletter/newsletter.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(config.mongoUri!),
    UserModule,
    AuthModule,
    ProductModule,
    WebhookModule,
    PaymentModule,
    TreatmentModule,
    ContactModule,
    ReviewModule,
    TreatmentResponseModule,
    DashboardModule,
    TreatmentBenefitModule,
    AddtocartModule,
    NewsletterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
