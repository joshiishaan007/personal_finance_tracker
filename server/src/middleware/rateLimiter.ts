import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { success: false, error: 'Too many requests, please try again later' },
});

export const aiRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => (req as unknown as { userId: string }).userId ?? req.ip ?? 'anonymous',
  message: { success: false, error: 'AI insight limit reached for today (max 5)' },
});
