import { Schema, model, Document, Types, Model, models } from 'mongoose';

// One row per issued refresh token. Only a SHA-256 HASH of the token is stored —
// the raw value lives solely in the user's httpOnly cookie, so a DB leak can't be
// replayed. Rotation marks the old row revoked and links it to its successor; a
// later hit on a revoked row is treated as reuse (theft) and revokes the family.
export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  replacedByHash: String,
}, { timestamps: true });

// TTL: MongoDB deletes the row once expiresAt passes — refresh-token cleanup with
// no cron (same pattern as the Trash feature).
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel =
  (models.RefreshToken as Model<IRefreshToken>) || model<IRefreshToken>('RefreshToken', refreshTokenSchema);
