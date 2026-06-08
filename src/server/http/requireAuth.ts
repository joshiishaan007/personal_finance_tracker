import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getEnv } from '../env';
import { HttpError } from './errors';
import { authRepository } from '../auth/auth.repository';

// Framework boundary — the JWT try/catch is the sanctioned exception to the
// no-try/catch rule. Returns the tenant userId or throws HttpError(401).
//
// Async because it re-checks the token version against the user document, giving
// server-side revocation: logout/forced sign-out bumps `tokenVersion`, which
// instantly invalidates every outstanding JWT for that user. (algorithms is
// pinned to HS256 to rule out alg-confusion.) catchRoute guarantees connectDB()
// has run before any controller calls this.
export async function requireAuth(): Promise<{ userId: string }> {
  const token = cookies().get('token')?.value;
  if (!token) throw new HttpError(401, 'Unauthorized');

  let payload: { sub?: string; tv?: number };
  try {
    payload = jwt.verify(token, getEnv().JWT_SECRET, { algorithms: ['HS256'] }) as { sub?: string; tv?: number };
  } catch {
    throw new HttpError(401, 'Token invalid or expired');
  }
  if (!payload.sub) throw new HttpError(401, 'Token invalid or expired');

  const user = await authRepository.findTokenVersion(payload.sub);
  if (!user) throw new HttpError(401, 'Token invalid or expired');
  // Tokens minted before tokenVersion existed carry no `tv`; treat both as 0 so
  // existing sessions stay valid until the user logs out (which bumps the count).
  if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) throw new HttpError(401, 'Session expired');

  return { userId: payload.sub };
}
