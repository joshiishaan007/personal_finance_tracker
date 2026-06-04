import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';

type AggRow = Record<string, unknown>;

export const balanceRepository = {
  // All-time totals by transaction type.
  totalsByType: (userId: string): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),

  userOpeningAndCurrency: async (
    userId: string,
  ): Promise<{ openingBalance: number; currency: string }> => {
    const user = await UserModel.findById(userId, { openingBalance: 1, currency: 1 }).lean();
    return { openingBalance: user?.openingBalance ?? 0, currency: user?.currency ?? 'INR' };
  },
};
