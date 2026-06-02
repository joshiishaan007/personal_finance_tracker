import { Types } from 'mongoose';
import { AIInsightModel } from '../models/aiInsight.model';
import { TransactionModel } from '../models/transaction.model';
import { GoalModel } from '../models/goal.model';

export const aiRepository = {
  aggregateSince: (userId: string, since: Date) =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: since } } },
      {
        $group: {
          _id: { type: '$type', categoryId: '$categoryId', isRecurring: '$isRecurring' },
          total: { $sum: '$amount' },
        },
      },
    ]),

  activeGoals: (userId: string) =>
    GoalModel.find({ userId, status: 'active' }).lean(),

  findCached: (userId: string, contextHash: string) =>
    AIInsightModel.findOne({
      userId,
      contextHash,
      expiresAt: { $gt: new Date() },
      dismissedAt: { $exists: false },
    }).lean(),

  findLatest: (userId: string) =>
    AIInsightModel.findOne({ userId, dismissedAt: { $exists: false } })
      .sort({ generatedAt: -1 })
      .lean(),

  replace: async (userId: string, doc: Record<string, unknown>) => {
    await AIInsightModel.deleteMany({ userId });
    return AIInsightModel.create({ ...doc, userId });
  },

  dismissActive: (userId: string) =>
    AIInsightModel.findOneAndUpdate(
      { userId, dismissedAt: { $exists: false } },
      { $set: { dismissedAt: new Date() } },
    ),
};
