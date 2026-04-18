import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId: string;
  userCurrency: string;
  userTimezone: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = (req.cookies as Record<string, string | undefined>)?.token;
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as { sub: string };
    (req as AuthRequest).userId = payload.sub;
    // Default values; routes that need real currency/tz should call attachUserMeta
    (req as AuthRequest).userCurrency = 'INR';
    (req as AuthRequest).userTimezone = 'Asia/Kolkata';
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token invalid or expired' });
  }
}

export async function attachUserMeta(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const { UserModel } = await import('../models/user.model');
  const authReq = req as AuthRequest;
  const user = await UserModel.findById(authReq.userId).select('currency timezone').lean();
  if (user) {
    authReq.userCurrency = user.currency;
    authReq.userTimezone = user.timezone;
  }
  next();
}
