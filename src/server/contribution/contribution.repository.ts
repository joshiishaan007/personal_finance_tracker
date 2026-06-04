import { Types } from 'mongoose';
import { ContributionModel } from '../models/contribution.model';

export const contributionRepository = {
  listByGoal: (userId: string, goalId: string) =>
    ContributionModel.find({ userId, goalId }).sort({ date: -1 }).lean(),

  create: (doc: Record<string, unknown>) => ContributionModel.create(doc),

  findById: (userId: string, id: string) => ContributionModel.findOne({ _id: id, userId }).lean(),

  remove: (userId: string, id: string) => ContributionModel.findOneAndDelete({ _id: id, userId }).lean(),

  removeByGoal: (userId: string, goalId: string) => ContributionModel.deleteMany({ userId, goalId }),

  // Distinct calendar days (user timezone) with a contribution — feeds the streak.
  async loggedDays(userId: string, since: Date, timezone: string): Promise<string[]> {
    const rows = await ContributionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } } } },
      { $sort: { _id: -1 } },
    ]);
    return rows.map((r) => String(r._id));
  },
};
