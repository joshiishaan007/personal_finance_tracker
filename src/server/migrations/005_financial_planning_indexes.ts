import type mongoose from 'mongoose';
import { SpendingPlanModel } from '../models/spendingPlan.model';
import { InvestmentModel } from '../models/investment.model';
import { GrossPLEntryModel } from '../models/grossPL.model';
import { TransactionModel } from '../models/transaction.model';

// Indexes for the new financial-planning collections, plus the new
// (userId, investmentId) index on transactions. syncIndexes is idempotent and
// the companion to autoIndex:false in production (see db.ts / migration 004).
const migration = {
  version: 5,
  description: 'Indexes for spending plan, investments, gross P&L; transaction investmentId',
  async up(_mongoose: typeof mongoose) {
    await SpendingPlanModel.syncIndexes();
    await InvestmentModel.syncIndexes();
    await GrossPLEntryModel.syncIndexes();
    await TransactionModel.syncIndexes();
  },
};

export default migration;
