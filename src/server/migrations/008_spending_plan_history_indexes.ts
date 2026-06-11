import type mongoose from 'mongoose';
import { SpendingPlanHistoryModel } from '../models/spendingPlanHistory.model';

// Creates the {userId, month} unique index for the new spending-plan monthly
// history collection. No data backfill — history is built going forward.
const migration = {
  version: 8,
  description: 'Create spending-plan monthly history indexes',
  async up(_mongoose: typeof mongoose) {
    await SpendingPlanHistoryModel.syncIndexes();
  },
};

export default migration;
