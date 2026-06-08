import { InstantCardModel } from '../models/instantCard.model';
import type { CreateInstantCard } from '@/shared';

export const instantCardRepository = {
  list: (userId: string) =>
    InstantCardModel.find({ userId }).sort({ createdAt: -1 }).lean().exec(),

  create: (userId: string, data: CreateInstantCard) =>
    InstantCardModel.create({ ...data, userId }),

  remove: (userId: string, id: string) =>
    InstantCardModel.findOneAndDelete({ _id: id, userId }).lean().exec(),
};
