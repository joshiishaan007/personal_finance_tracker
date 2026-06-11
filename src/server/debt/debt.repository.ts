import { Types } from 'mongoose';
import { DebtModel } from '../models/debt.model';
import { escapeRegex } from '../util/escapeRegex';
import type { CreateDebt } from '@/shared';

export const debtRepository = {
  list: async (userId: string, filter: { status?: string; direction?: string; friendName?: string; sourceTxId?: string; page: number; limit: number }) => {
    const q: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (filter.status && filter.status !== 'all') q.status = filter.status;
    if (filter.direction && filter.direction !== 'all') q.direction = filter.direction;
    if (filter.friendName) q.friendName = { $regex: `^${escapeRegex(filter.friendName)}$`, $options: 'i' };
    if (filter.sourceTxId) q.sourceTxId = filter.sourceTxId;
    const [items, total] = await Promise.all([
      DebtModel.find(q).sort({ createdAt: -1 }).skip((filter.page - 1) * filter.limit).limit(filter.limit).lean().exec(),
      DebtModel.countDocuments(q),
    ]);
    return { items, total };
  },

  createMany: (userId: string, debts: CreateDebt[]) =>
    DebtModel.insertMany(
      debts.map((d) => ({ ...d, userId, friendName: d.friendName.trim() })),
    ),

  // Pending debts grouped by friendName (case-insensitive key), scoped to a direction.
  summary: (userId: string, direction: string) =>
    DebtModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'pending', direction } },
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

  deleteBySourceTx: (userId: string, sourceTxId: string) =>
    DebtModel.deleteMany({ userId: new Types.ObjectId(userId), sourceTxId }).exec(),

  // Revert any debt settled via this transaction back to pending — used when the
  // settlement tx is deleted directly from the feed so the link can't go stale.
  unlinkSettlementTx: (userId: string, transactionId: string) =>
    DebtModel.updateMany(
      { userId: new Types.ObjectId(userId), transactionId },
      { $set: { status: 'pending' }, $unset: { transactionId: '', settledAt: '' } },
    ).exec(),

  // Delete settled entries older than `before`.
  // Falls back to createdAt for entries that pre-date the settledAt field.
  deleteOldSettled: (userId: string, before: Date) =>
    DebtModel.deleteMany({
      userId: new Types.ObjectId(userId),
      status: 'settled',
      $or: [
        { settledAt: { $lt: before } },
        { settledAt: { $exists: false }, createdAt: { $lt: before } },
      ],
    }).exec(),
};
