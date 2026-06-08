import jwt from 'jsonwebtoken';
import { authRepository as repo } from './auth.repository';
import type { IUser } from '@/server/models/user.model';

// `tv` (token version) lets logout/forced-signout invalidate outstanding tokens:
// requireAuth rejects any token whose tv no longer matches the user's.
export function signJWT(userId: string, secret: string, tokenVersion = 0): string {
  return jwt.sign({ sub: userId, tv: tokenVersion }, secret, { expiresIn: '7d', algorithm: 'HS256' });
}

export const authService = {
  signJWT,

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

  // Invalidate every outstanding token for a user (logout / forced sign-out).
  bumpTokenVersion: (userId: string) => repo.bumpTokenVersion(userId),
};
