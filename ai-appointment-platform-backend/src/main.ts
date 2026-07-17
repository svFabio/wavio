import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const allowedOrigins = env.CORS_ORIGINS
    ? env.CORS_ORIGINS.split(',').map((s: string) => s.trim())
    : [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : env.NODE_ENV !== 'production',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-negocio-id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(helmet());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(Number(env.PORT), '0.0.0.0');
}

bootstrap();
