import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './common/validate-env';

// require() so default exports work in CJS build (Railway/Docker)
const expressRaw = require('express').raw;
const cookieParser = require('cookie-parser');

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use('/api/webhooks/stripe', expressRaw({ type: 'application/json' }));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl === '/api/webhooks/stripe' && req.method === 'POST') {
      return next();
    }
    return express.json()(req, res, next);
  });
  app.use(cookieParser());

  // CORS: allow FRONTEND_URL (e.g. Vercel) for security; fallback to CORS_ORIGIN or allow all in dev
  const allowedOrigin = (process.env.FRONTEND_URL || process.env.CORS_ORIGIN) ?? true;
  app.enableCors({ origin: allowedOrigin, credentials: true });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
bootstrap();
