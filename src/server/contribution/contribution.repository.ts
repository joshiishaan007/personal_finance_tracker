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

  // Per-goal daily totals (user timezone) since `since` — feeds per-goal today
  // value + streak on the goals home. One row per (goal, day).
  async recentByGoal(userId: string, since: Date, timezone: string): Promise<{ goalId: string; day: string; value: number }[]> {
    const rows = await ContributionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: since } } },
      {
        $group: {
          _id: { goalId: '$goalId', day: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone } } },
          value: { $sum: '$value' },
        },
      },
      { $project: { _id: 0, goalId: '$_id.goalId', day: '$_id.day', value: 1 } },
    ]);
    return rows.map((r) => ({ goalId: String(r.goalId), day: String(r.day), value: Number(r.value) }));
  },

  // Day-by-day contribution totals for the heatmap.
  // goalId present → sum values per day for that goal.
  // goalId absent  → count contributions per day across all goals.
  async heatmap(
    userId: string,
    from: Date,
    to: Date,
    goalId?: string,
  ): Promise<{ date: string; value: number }[]> {
    const match: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      date: { $gte: from, $lte: to },
    };
    if (goalId) match.goalId = new Types.ObjectId(goalId);

    const rows = await ContributionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          value: goalId ? { $sum: '$value' } : { $sum: 1 },
        },
      },
      { $project: { _id: 0, date: '$_id', value: 1 } },
      { $sort: { date: 1 } },
    ]);
    return rows as { date: string; value: number }[];
  },
};
