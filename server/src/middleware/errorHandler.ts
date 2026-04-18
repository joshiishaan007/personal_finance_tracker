import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  const status = (err as Error & { status?: number }).status ?? 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    requestId: req.requestId,
  });
}
