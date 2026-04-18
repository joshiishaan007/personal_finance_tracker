import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import type { IUser } from '../models/user.model';

export function signJWT(userId: string, secret: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

export async function findOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<IUser> {
  const existing = await UserModel.findOne({ googleId: profile.googleId });
  if (existing) return existing;
  return UserModel.create({
    googleId: profile.googleId,
    email: profile.email,
    name: profile.name,
    avatar: profile.avatar,
  });
}
