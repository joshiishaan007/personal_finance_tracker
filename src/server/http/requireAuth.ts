import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getEnv } from '../env';
import { HttpError } from './errors';

// Framework boundary — the JWT try/catch is the sanctioned exception to the
// no-try/catch rule. Returns the tenant userId or throws HttpError(401).
export function requireAuth(): { userId: string } {
  const token = cookies().get('token')?.value;
  if (!token) throw new HttpError(401, 'Unauthorized');
  try {
    const payload = jwt.verify(token, getEnv().JWT_SECRET) as { sub: string };
    return { userId: payload.sub };
  } catch {
    throw new HttpError(401, 'Token invalid or expired');
  }
}
