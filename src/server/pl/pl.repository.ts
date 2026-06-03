import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { BudgetModel } from '../models/budget.model';

type AggRow = Record<string, unknown>;

export const plRepository = {
  // Actual spend by type+category within a date range (joined to categories).
  actualByTypeAndCategory: (userId: string, start: Date, end: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { type: '$type', categoryId: '$categoryId' }, actual: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),

  // All budgets for the tenant, category populated.
  budgets: (userId: string) =>
    BudgetModel.find({ userId }).populate('categoryId').lean(),
};
