import { GrossPLEntryModel } from '../models/grossPL.model';
import { UserModel } from '../models/user.model';

export const grossPLRepository = {
  list: (userId: string) => GrossPLEntryModel.find({ userId }).sort({ month: 1 }).lean(),

  // One entry per (user, month) — upsert keyed on the unique pair.
  upsertByMonth: (userId: string, month: Date, set: Record<string, unknown>) =>
    GrossPLEntryModel.findOneAndUpdate(
      { userId, month },
      { $set: set },
      { upsert: true, new: true },
    ),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    GrossPLEntryModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }),

  remove: (userId: string, id: string) =>
    GrossPLEntryModel.findOneAndDelete({ _id: id, userId }).lean(),

  // Tenant currency — resolved server-side, never trusted from the client.
  userMeta: async (userId: string): Promise<{ currency: string }> => {
    const user = await UserModel.findOne({ _id: userId }, { currency: 1 }).lean();
    return { currency: user?.currency ?? 'INR' };
  },
};
