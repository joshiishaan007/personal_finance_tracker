import { Types } from 'mongoose';
import { DebtModel } from '../models/debt.model';
import type { CreateDebt } from '@/shared';

export const debtRepository = {
  list: (userId: string, filter: { status?: string; friendName?: string }) => {
    const q: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (filter.status && filter.status !== 'all') q.status = filter.status;
    if (filter.friendName) q.friendName = new RegExp(`^${filter.friendName}$`, 'i');
    return DebtModel.find(q).sort({ createdAt: -1 }).lean().exec();
  },

  createMany: (userId: string, debts: CreateDebt[]) =>
    DebtModel.insertMany(
      debts.map((d) => ({ ...d, userId, friendName: d.friendName.trim() })),
    ),

  // Pending debts grouped by friendName (case-insensitive key).
  summary: (userId: string) =>
    DebtModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'pending' } },
      { $group: {
        _id:         { $toLower: '$friendName' },
        displayName: { $first: '$friendName' },
        total:       { $sum: '$amount' },
        count:       { $sum: 1 },
      }},
      { $sort: { total: -1 } },
    ]),

  findOne: (userId: string, id: string) =>
    DebtModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).lean().exec(),

  update: (userId: string, id: string, data: Record<string, unknown>) =>
    DebtModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true },
    ).lean().exec(),

  remove: (userId: string, id: string) =>
    DebtModel.findOneAndDelete({ _id: id, userId: new Types.ObjectId(userId) }).lean().exec(),
};
