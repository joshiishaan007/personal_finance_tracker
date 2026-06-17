import type mongoose from 'mongoose';
import { TransactionModel } from '../models/transaction.model';

// Adds the partial TTL index on transactions.deletedAt so MongoDB auto-purges
// soft-deleted rows 30 days after deletion — Trash with no cron. syncIndexes is
// idempotent and keeps the existing indexes (all are declared on the schema).
const migration = {
  version: 12,
  description: 'Transaction soft-delete TTL index (deletedAt)',
  async up(_mongoose: typeof mongoose) {
    await TransactionModel.syncIndexes();
  },
};

export default migration;
