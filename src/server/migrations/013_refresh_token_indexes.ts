import type mongoose from 'mongoose';
import { RefreshTokenModel } from '../models/refreshToken.model';

// Creates the refresh-token indexes: unique tokenHash, userId, and the TTL on
// expiresAt that auto-purges expired tokens with no cron. syncIndexes is idempotent.
const migration = {
  version: 13,
  description: 'Refresh token indexes (unique hash + TTL expiry)',
  async up(_mongoose: typeof mongoose) {
    await RefreshTokenModel.syncIndexes();
  },
};

export default migration;
