import type mongoose from 'mongoose';
import { TransactionModel } from '../models/transaction.model';

// Backs offline-replay idempotency: at most one transaction per (userId, clientId).
// Partial so historical rows without a clientId are exempt. createIndex is a no-op
// if the index already exists, so this is safe to re-run.
const migration = {
  version: 2,
  description: 'Add partial-unique (userId, clientId) index for offline idempotency',
  async up(_mongoose: typeof mongoose) {
    const coll = TransactionModel.collection;
    // Mongoose autoIndex may have already built this index from the schema; skip
    // if a {userId, clientId} index exists (any name) to avoid IndexOptionsConflict.
    const existing = await coll.indexes();
    const present = existing.some((ix) => {
      const key = ix.key as Record<string, unknown>;
      return key.userId === 1 && key.clientId === 1;
    });
    if (present) return;

    await coll.createIndex(
      { userId: 1, clientId: 1 },
      { unique: true, partialFilterExpression: { clientId: { $exists: true } } },
    );
  },
};

export default migration;
