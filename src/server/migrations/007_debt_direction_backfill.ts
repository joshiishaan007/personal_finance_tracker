import type mongoose from 'mongoose';
import { DebtModel } from '../models/debt.model';

// Adds the `direction` discriminator to the Debt collection. Existing rows are all
// lending entries ("people owe you"), so backfill them to 'they_owe_me' — otherwise
// exact-match `{ direction: 'they_owe_me' }` queries would miss the legacy rows that
// lack the field. syncIndexes builds the new { userId, direction, status } and
// { userId, transactionId } indexes.
const migration = {
  version: 7,
  description: 'Backfill Debt.direction to they_owe_me and sync new debt indexes',
  async up(_mongoose: typeof mongoose) {
    await DebtModel.updateMany(
      { direction: { $exists: false } },
      { $set: { direction: 'they_owe_me' } },
    );
    await DebtModel.syncIndexes();
  },
};

export default migration;
