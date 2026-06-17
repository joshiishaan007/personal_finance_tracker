import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { authRepository as repo } from './auth.repository';
import { refreshTokenRepository as rtRepo } from './refreshToken.repository';
import { Ok, Err, type Result } from '../http/result';
import type { IUser } from '@/server/models/user.model';

const ACCESS_TTL = '30m';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// `tv` (token version) lets logout/forced-signout invalidate outstanding access
// tokens: requireAuth rejects a token whose tv no longer matches the user's.
export function signJWT(userId: string, secret: string, tokenVersion = 0): string {
  return jwt.sign({ sub: userId, tv: tokenVersion }, secret, { expiresIn: ACCESS_TTL, algorithm: 'HS256' });
}

// Refresh tokens are 256-bit random — already high-entropy, so a plain SHA-256 is
// the right hash (no salt/bcrypt needed, and it must be deterministic to look up).
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;     // raw value — goes in the cookie, never stored
  refreshExpiresAt: Date;
}

// Mint a fresh access + refresh pair and persist the refresh hash.
async function issueTokens(userId: string, tokenVersion: number, secret: string): Promise<IssuedTokens> {
  const accessToken = signJWT(userId, secret, tokenVersion);
  const refreshToken = randomBytes(32).toString('base64url');
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await rtRepo.create({ userId, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt });
  return { accessToken, refreshToken, refreshExpiresAt };
}

export const authService = {
  signJWT,
  issueTokens,

  async findOrCreateUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<IUser> {
    const existing = await repo.findByGoogleId(profile.googleId);
    if (existing) return existing;
    return repo.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    });
  },

  getById: (userId: string) => repo.findById(userId),

  // Rotate: validate the presented refresh token, then issue a new pair and
  // revoke the old token (linking it to its successor). A hit on an already-
  // revoked row means the token was replayed → revoke the whole family.
  async rotateRefreshToken(
    rawToken: string,
    secret: string,
  ): Promise<Result<IssuedTokens & { userId: string }, 'unauthorized'>> {
    const hash = hashToken(rawToken);
    const row = await rtRepo.findByHash(hash);
    if (!row) return Err('unauthorized');
    if (row.expiresAt.getTime() <= Date.now()) return Err('unauthorized');
    if (row.revokedAt) {
      await rtRepo.revokeAllForUser(String(row.userId));
      return Err('unauthorized');
    }
    const userId = String(row.userId);
    const user = await repo.findTokenVersion(userId);
    if (!user) return Err('unauthorized');

    const issued = await issueTokens(userId, user.tokenVersion ?? 0, secret);
    await rtRepo.markRevoked(hash, hashToken(issued.refreshToken));
    return Ok({ ...issued, userId });
  },

  // Logout: identify the user from their refresh token, then bump tokenVersion
  // (invalidates all access tokens) and revoke every refresh token (all devices).
  async logout(rawToken: string): Promise<void> {
    const row = await rtRepo.findByHash(hashToken(rawToken));
    if (!row) return;
    const userId = String(row.userId);
    await repo.bumpTokenVersion(userId);
    await rtRepo.revokeAllForUser(userId);
  },

  // Invalidate every outstanding session for a user (forced sign-out).
  async bumpTokenVersion(userId: string) {
    await repo.bumpTokenVersion(userId);
    await rtRepo.revokeAllForUser(userId);
  },
};
