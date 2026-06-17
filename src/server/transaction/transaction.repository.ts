import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { escapeRegex } from '../util/escapeRegex';
import type { TransactionFilter } from '@/shared';

export interface FrequentTemplateRow {
  _id: { categoryId: string; amount: number; paymentMethod: string };
  count: number;
  category?: { name: string; icon: string };
}

function buildQuery(userId: string, f: Partial<TransactionFilter>): Record<string, unknown> {
  const query: Record<string, unknown> = { userId };
  if (f.startDate || f.endDate) {
    query.date = {
      ...(f.startDate && { $gte: new Date(f.startDate) }),
      ...(f.endDate && { $lte: new Date(f.endDate) }),
    };
  }
  if (f.type) query.type = f.type;
  if (f.categoryId) query.categoryId = f.categoryId;
  if (f.tags?.length) query.tags = { $in: f.tags };
  if (f.minAmount !== undefined || f.maxAmount !== undefined) {
    query.amount = {
      ...(f.minAmount !== undefined && { $gte: f.minAmount }),
      ...(f.maxAmount !== undefined && { $lte: f.maxAmount }),
    };
  }
  if (f.paymentMethod) query.paymentMethod = f.paymentMethod;
  if (f.search) {
    const safe = escapeRegex(f.search);
    query.$or = [
      { note: { $regex: safe, $options: 'i' } },
      { tags: { $regex: safe, $options: 'i' } },
    ];
  }
  return query;
}

export const transactionRepository = {
  async list(userId: string, filter: TransactionFilter) {
    const query = buildQuery(userId, filter);
    const { page, limit } = filter;
    const [items, total] = await Promise.all([
      TransactionModel.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TransactionModel.countDocuments(query),
    ]);
    return { items, total };
  },

  create: (doc: Record<string, unknown>) => TransactionModel.create(doc),

  // Idempotent create keyed on the client-generated clientId — an offline replay
  // of the same queued create returns the existing row instead of duplicating.
  upsertByClientId: (userId: string, clientId: string, doc: Record<string, unknown>) =>
    TransactionModel.findOneAndUpdate(
      { userId, clientId },
      { $setOnInsert: doc },
      { upsert: true, new: true },
    ).lean(),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    TransactionModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  // Soft delete — moves the row to Trash. The TTL index purges it after 30 days.
  remove: (userId: string, id: string) =>
    TransactionModel.findOneAndUpdate({ _id: id, userId }, { $set: { deletedAt: new Date() } }, { new: true }).lean(),

  // Trash-aware queries: each references `deletedAt`, so the schema middleware
  // skips the live-only filter and lets these see soft-deleted rows.
  listTrash: (userId: string) =>
    TransactionModel.find({ userId, deletedAt: { $exists: true } }).sort({ deletedAt: -1 }).limit(200).lean(),

  restore: (userId: string, id: string) =>
    TransactionModel.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: true } },
      { $unset: { deletedAt: 1 } },
      { new: true },
    ).lean(),

  purgeOne: (userId: string, id: string) =>
    TransactionModel.findOneAndDelete({ _id: id, userId, deletedAt: { $exists: true } }).lean(),

  purgeAll: (userId: string) =>
    TransactionModel.deleteMany({ userId, deletedAt: { $exists: true } }),

  findByHash: (userId: string, hash: string) =>
    TransactionModel.findOne({ userId, hash }).lean(),

  // One query for a whole import batch — returns the subset of hashes that already
  // exist for this user (replaces a per-row findByHash loop). Uses the (userId, hash) index.
  findExistingHashes: async (userId: string, hashes: string[]): Promise<Set<string>> => {
    const rows = await TransactionModel.find(
      { userId, hash: { $in: hashes } },
      { hash: 1 },
    ).lean<{ hash: string }[]>();
    return new Set(rows.map((r) => r.hash));
  },

  insertMany: (docs: Record<string, unknown>[]) => TransactionModel.insertMany(docs),

  deleteBatch: (userId: string, batchId: string) =>
    TransactionModel.deleteMany({ userId, importBatchId: batchId }),

  // Total expense amount for a category in a date window — used for budget alerts.
  sumByCategoryPeriod: (userId: string, categoryId: string, from: Date, to: Date) =>
    TransactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          categoryId,
          type: 'expense',
          date: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).then((rows) => Number(rows[0]?.total ?? 0)),

  // Most-repeated expense templates (same category + amount + payment method) since
  // `since` — the basis for one-tap "repeat" chips. count>=2 keeps it to real habits.
  frequentTemplates: (userId: string, since: Date, limit: number): Promise<FrequentTemplateRow[]> =>
    TransactionModel.aggregate<FrequentTemplateRow>([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: since }, type: 'expense' } },
      {
        $group: {
          _id: { categoryId: '$categoryId', amount: '$amount', paymentMethod: '$paymentMethod' },
          count: { $sum: 1 },
          lastDate: { $max: '$date' },
        },
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1, lastDate: -1 } },
      { $limit: limit },
      { $lookup: { from: 'categories', localField: '_id.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),
};
