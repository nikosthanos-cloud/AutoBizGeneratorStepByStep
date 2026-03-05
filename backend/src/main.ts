import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/webhooks/stripe' && req.method === 'POST') {
      return next();
    }
    return express.json()(req, res, next);
  });
  app.use(cookieParser());
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
