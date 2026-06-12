import { InstantCardModel } from '../models/instantCard.model';
import type { CreateInstantCard } from '@/shared';

export const instantCardRepository = {
  list: (userId: string) =>
    InstantCardModel.find({ userId }).sort({ sortOrder: 1, createdAt: -1 }).lean().exec(),

  create: async (userId: string, data: CreateInstantCard) => {
    // Append new cards at the end of the user's custom order.
    const last = await InstantCardModel.findOne({ userId }).sort({ sortOrder: -1 }).select('sortOrder').lean<{ sortOrder?: number }>();
    const sortOrder = (last?.sortOrder ?? -1) + 1;
    return InstantCardModel.create({ ...data, userId, sortOrder });
  },

  remove: (userId: string, id: string) =>
    InstantCardModel.findOneAndDelete({ _id: id, userId }).lean().exec(),

  // Persist a new order — each id's index becomes its sortOrder. userId-scoped per op.
  reorder: (userId: string, ids: string[]) =>
    InstantCardModel.bulkWrite(
      ids.map((id, i) => ({
        updateOne: { filter: { _id: id, userId }, update: { $set: { sortOrder: i } } },
      })),
    ),
};
