import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raw } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use('/webhooks/clerk', raw({ type: '*/*' }));
  app.use('/auth/webhook', raw({ type: '*/*' }));
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log('Running in development mode');
}
bootstrap();
