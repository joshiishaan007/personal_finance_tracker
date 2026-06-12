import type mongoose from 'mongoose';
import { InstantCardModel } from '../models/instantCard.model';

// Backfill sortOrder on existing instant cards so the new ordered list keeps the
// current display order (newest first → sortOrder 0..n per user). Idempotent:
// only rows missing the field are touched.
const migration = {
  version: 10,
  description: 'Backfill instant-card sortOrder and sync indexes',
  async up(_mongoose: typeof mongoose) {
    const cards = await InstantCardModel.find({ sortOrder: { $exists: false } })
      .sort({ userId: 1, createdAt: -1 })
      .select('_id userId')
      .lean<{ _id: unknown; userId: unknown }[]>();

    const perUser = new Map<string, number>();
    const ops = cards.map((c) => {
      const u = String(c.userId);
      const idx = perUser.get(u) ?? 0;
      perUser.set(u, idx + 1);
      return { updateOne: { filter: { _id: c._id }, update: { $set: { sortOrder: idx } } } };
    });

    if (ops.length) await InstantCardModel.bulkWrite(ops);
    await InstantCardModel.syncIndexes();
  },
};

export default migration;
