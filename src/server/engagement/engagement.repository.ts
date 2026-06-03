import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';

export interface DayRollup {
  day: string; // 'YYYY-MM-DD' in the user's timezone
  count: number;
  expense: number; // minor units
  income: number; // minor units
}

export const engagementRepository = {
  // Tenant currency/timezone — resolved server-side, never trusted from the client.
  async userMeta(userId: string): Promise<{ currency: string; timezone: string }> {
    const user = await UserModel.findOne({ _id: userId }, { currency: 1, timezone: 1 }).lean();
    return { currency: user?.currency ?? 'INR', timezone: user?.timezone ?? 'Asia/Kolkata' };
  },

  // Per-day rollup (in the user's timezone) since `since`, most-recent first.
  // One aggregation feeds the streak (which days have activity), today's totals,
  // and the 30-day average. Scoped to the tenant.
  async dailyRollup(userId: string, since: Date, timezone: string): Promise<DayRollup[]> {
    const rows = await TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } },
          count: { $sum: 1 },
          expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
          income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: -1 } },
    ]);
    return rows.map((r) => ({
      day: String(r._id),
      count: r.count as number,
      expense: r.expense as number,
      income: r.income as number,
    }));
  },
};
