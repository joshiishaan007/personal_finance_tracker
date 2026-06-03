import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';

type AggRow = Record<string, unknown>;

// Tenant currency/timezone — resolved server-side, never trusted from the client.
async function userMeta(userId: string): Promise<{ currency: string; timezone: string }> {
  const user = await UserModel.findOne({ _id: userId }, { currency: 1, timezone: 1 }).lean();
  return { currency: user?.currency ?? 'INR', timezone: user?.timezone ?? 'Asia/Kolkata' };
}

export const analyticsRepository = {
  userMeta,

  // Month-to-date totals by transaction type.
  mtdByType: (userId: string, monthStart: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: monthStart } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),

  // Six-month trend grouped by month/year/type.
  sixMonthByType: (userId: string, sixMonthsAgo: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),

  // Top expense categories month-to-date (joined to the categories collection).
  topExpenseCategories: (userId: string, monthStart: Date, limit: number): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: monthStart }, type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: limit },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),

  // Totals by type within a date range.
  totalsByType: (userId: string, start: Date, end: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),

  // Expense totals by category within a date range (joined to categories).
  expenseByCategory: (userId: string, start: Date, end: Date, limit: number): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end }, type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: limit },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),

  // Per-day totals by type within a date range.
  byDay: (userId: string, start: Date, end: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]),

  // Per-month totals by type within a date range (yearly view).
  byMonth: (userId: string, start: Date, end: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]),

  // Totals by type+category within a custom date range (joined to categories).
  byTypeAndCategory: (userId: string, start: Date, end: Date): Promise<AggRow[]> =>
    TransactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { type: '$type', categoryId: '$categoryId' },
          total: { $sum: '$amount' },
        },
      },
      { $lookup: { from: 'categories', localField: '_id.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),
};
