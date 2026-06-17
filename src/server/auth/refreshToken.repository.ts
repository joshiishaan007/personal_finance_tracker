import { Types } from 'mongoose';
import { RefreshTokenModel } from '@/server/models/refreshToken.model';

export interface RefreshTokenRow {
  _id: unknown;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
}

export const refreshTokenRepository = {
  create: (doc: { userId: string; tokenHash: string; expiresAt: Date }) =>
    RefreshTokenModel.create({
      userId: new Types.ObjectId(doc.userId),
      tokenHash: doc.tokenHash,
      expiresAt: doc.expiresAt,
    }),

  findByHash: (tokenHash: string) =>
    RefreshTokenModel.findOne({ tokenHash }).lean<RefreshTokenRow | null>().exec(),

  // Revoke a single (not-yet-revoked) token, optionally recording its successor.
  markRevoked: (tokenHash: string, replacedByHash?: string) =>
    RefreshTokenModel.updateOne(
      { tokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date(), ...(replacedByHash ? { replacedByHash } : {}) } },
    ).exec(),

  // Kill every live token for a user (logout / theft detection / forced sign-out).
  revokeAllForUser: (userId: string) =>
    RefreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    ).exec(),
};
