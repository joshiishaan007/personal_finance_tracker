import { RecurringRuleModel } from '../models/recurringRule.model';
import { TransactionModel } from '../models/transaction.model';

export const recurringRepository = {
  list: (userId: string) =>
    RecurringRuleModel.find({ userId }).sort({ 'templateTransaction.amount': -1 }).lean(),

  listActive: (userId: string) =>
    RecurringRuleModel.find({ userId, isActive: true }).lean(),

  create: (doc: Record<string, unknown>) => RecurringRuleModel.create(doc),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    RecurringRuleModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) =>
    RecurringRuleModel.findOneAndDelete({ _id: id, userId }).lean(),

  advance: (userId: string, id: string, set: Record<string, unknown>) =>
    RecurringRuleModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  findTransactionByHash: (userId: string, hash: string) =>
    TransactionModel.findOne({ userId, hash }).lean(),

  createTransaction: (doc: Record<string, unknown>) => TransactionModel.create(doc),
};
