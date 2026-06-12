import type mongoose from 'mongoose';
import { TransactionModel } from '../models/transaction.model';

// Reimbursement is now a first-class transaction type. Earlier debt settlements
// recorded the incoming repayment as an `income` transaction tagged
// 'reimbursement' (the only producer of that tag) — convert those so they're
// excluded from income KPIs/spending-plan and render as Reimbursement.
const migration = {
  version: 11,
  description: 'Convert reimbursement-tagged income transactions to the reimbursement type',
  async up(_mongoose: typeof mongoose) {
    await TransactionModel.updateMany(
      { type: 'income', tags: 'reimbursement' },
      { $set: { type: 'reimbursement' } },
    );
  },
};

export default migration;
