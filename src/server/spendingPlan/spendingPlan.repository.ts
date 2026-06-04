import { Types } from 'mongoose';
import { SpendingPlanModel } from '../models/spendingPlan.model';
import { TransactionModel } from '../models/transaction.model';
import { CategoryModel } from '../models/category.model';
import { UserModel } from '../models/user.model';

export const spendingPlanRepository = {
  getPlan: (userId: string) => SpendingPlanModel.findOne({ userId }).lean(),

  // One plan per user — upsert keyed on the unique userId.
  upsertPlan: (userId: string, set: Record<string, unknown>) =>
    SpendingPlanModel.findOneAndUpdate(
      { userId },
      { $set: { ...set, userId } },
      { upsert: true, new: true },
    ).lean(),

  // Income rows for the cycle resolver (last ~180 days).
  recentIncomes: (userId: string, since: Date) =>
    TransactionModel.find(
      { userId, type: 'income', date: { $gte: since } },
      { date: 1, amount: 1 },
    ).lean(),

  // This-cycle outflow grouped by category (expense + investment count as "used").
  spendByCategory: (userId: string, start: Date, end: Date): Promise<Array<{ _id: unknown; total: number }>> =>
    TransactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: start, $lt: end },
          type: { $in: ['expense', 'investment'] },
        },
      },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    ]),

  // Expense/investment categories (user-owned + defaults) for unassigned detection.
  listCategories: (userId: string) =>
    CategoryModel.find({
      $or: [{ userId }, { isDefault: true }],
      type: { $in: ['expense', 'investment'] },
    }).lean(),

  // Tenant currency — resolved server-side, never trusted from the client.
  currency: async (userId: string): Promise<string> => {
    const user = await UserModel.findOne({ _id: userId }, { currency: 1 }).lean();
    return user?.currency ?? 'INR';
  },
};
