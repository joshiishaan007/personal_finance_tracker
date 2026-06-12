import { Types } from 'mongoose';
import { SpendingPlanModel } from '../models/spendingPlan.model';
import { SpendingPlanHistoryModel } from '../models/spendingPlanHistory.model';
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

  // Income rows for the cycle resolver. Reimbursement-category income (money
  // repaid to you) is excluded so it doesn't inflate the plan's base income.
  recentIncomes: (userId: string, since: Date, excludeCategoryIds: Types.ObjectId[] = []) =>
    TransactionModel.find(
      {
        userId,
        type: 'income',
        date: { $gte: since },
        ...(excludeCategoryIds.length ? { categoryId: { $nin: excludeCategoryIds } } : {}),
      },
      { date: 1, amount: 1 },
    ).lean(),

  // Reimbursement-type category ids (user-owned + global defaults).
  reimbursementCategoryIds: async (userId: string): Promise<Types.ObjectId[]> => {
    const cats = await CategoryModel.find(
      { type: 'reimbursement', $or: [{ userId }, { isDefault: true, userId: { $exists: false } }] },
      { _id: 1 },
    ).lean<{ _id: Types.ObjectId }[]>();
    return cats.map((c) => c._id);
  },

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

  // Expense/investment categories (user-owned + global defaults) for unassigned
  // detection. The default branch requires userId absent so a user-owned doc can
  // never match it (defense in depth — mirrors categoryRepository.list).
  listCategories: (userId: string) =>
    CategoryModel.find({
      $or: [{ userId }, { isDefault: true, userId: { $exists: false } }],
      type: { $in: ['expense', 'investment'] },
    }).lean(),

  // Tenant currency — resolved server-side, never trusted from the client.
  currency: async (userId: string): Promise<string> => {
    const user = await UserModel.findOne({ _id: userId }, { currency: 1 }).lean();
    return user?.currency ?? 'INR';
  },

  // One frozen snapshot per (user, month) — upserted live for the current month.
  upsertHistory: (userId: string, month: Date, set: Record<string, unknown>) =>
    SpendingPlanHistoryModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), month },
      { $set: { ...set, userId: new Types.ObjectId(userId), month } },
      { upsert: true, new: true },
    ).lean(),

  // Completed months only (strictly before `before`), newest first.
  listHistory: (userId: string, before: Date, limit: number) =>
    SpendingPlanHistoryModel.find({ userId: new Types.ObjectId(userId), month: { $lt: before } })
      .sort({ month: -1 })
      .limit(limit)
      .lean(),
};
