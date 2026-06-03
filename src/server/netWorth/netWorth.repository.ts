import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';

export const netWorthRepository = {
  list: (userId: string) =>
    NetWorthSnapshotModel.find({ userId }).sort({ date: -1 }).limit(36).lean(),

  latest: (userId: string) =>
    NetWorthSnapshotModel.findOne({ userId }).sort({ date: -1 }).lean(),

  upsertForMonth: (userId: string, monthKey: Date, set: Record<string, unknown>) =>
    NetWorthSnapshotModel.findOneAndUpdate(
      { userId, date: monthKey },
      { $set: set },
      { upsert: true, new: true },
    ).lean(),
};
