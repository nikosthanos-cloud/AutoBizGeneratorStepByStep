import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Development middleware: sets request.user from headers so AdminGuard can allow access.
 * Send X-User-Id, X-User-Email, X-User-Role (e.g. ADMIN) when calling admin endpoints.
 * In production, replace with proper JWT auth middleware.
 */
@Injectable()
export class AuthDevMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const role = req.headers['x-user-role'] as string | undefined;
    const id = req.headers['x-user-id'] as string | undefined;
    const email = req.headers['x-user-email'] as string | undefined;
    if (role && id && email) {
      (req as Request & { user?: { id: string; email: string; role: string } }).user = {
        id,
        email,
        role: role.toUpperCase(),
      };
    }
    next();
  }
}
