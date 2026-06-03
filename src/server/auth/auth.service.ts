import jwt from 'jsonwebtoken';
import { authRepository as repo } from './auth.repository';
import type { IUser } from '@/server/models/user.model';

export function signJWT(userId: string, secret: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
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
};
