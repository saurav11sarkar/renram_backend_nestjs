import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import config from './app/config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './app/middlewares/globalErrors.filter';
import { UtilsInterceptor } from './app/utils/utils.interceptor';
import * as express from 'express';

const port = config.port;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug'],
  });
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use('/api/v1/webhook', express.raw({ type: 'application/json' }));

  app.setGlobalPrefix('api/v1',{
    exclude:['']
  });
  app.useGlobalInterceptors(new UtilsInterceptor());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));
  await app.listen(port ?? 3000, () => {
    console.log(`Server is running http://localhost:${port ?? 3000}`);
  });
}

bootstrap().catch(console.error);
