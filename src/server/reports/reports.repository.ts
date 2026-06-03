import { Types } from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';

export const reportsRepository = {
  monthlyTotals: (userId: string, start: Date, end: Date) =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),

  budgets: (userId: string) => BudgetModel.find({ userId }).lean(),

  activeGoals: (userId: string) => GoalModel.find({ userId, status: 'active' }).lean(),

  yearlyByMonth: (userId: string, start: Date, end: Date) =>
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]),

  achievedGoals: (userId: string) => GoalModel.find({ userId, status: 'achieved' }).lean(),
};
