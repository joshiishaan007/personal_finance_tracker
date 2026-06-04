import { Types } from 'mongoose';
import { InvestmentModel } from '../models/investment.model';
import { TransactionModel } from '../models/transaction.model';

export const investmentRepository = {
  list: (userId: string) => InvestmentModel.find({ userId }).sort({ createdAt: -1 }).lean(),

  create: (userId: string, set: Record<string, unknown>) =>
    InvestmentModel.create({ ...set, userId }),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    InvestmentModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) =>
    InvestmentModel.findOneAndDelete({ _id: id, userId }).lean(),

  // Derives each investment's actual invested figure by summing the amounts of all
  // transactions linked to it. Returns one row per investmentId.
  investedByInvestment: (userId: string) =>
    TransactionModel.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { userId: new Types.ObjectId(userId), investmentId: { $exists: true } } },
      { $group: { _id: '$investmentId', total: { $sum: '$amount' } } },
    ]),
};
