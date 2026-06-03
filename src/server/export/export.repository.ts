import { UserModel } from '../models/user.model';
import { TransactionModel } from '../models/transaction.model';
import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';

export const exportRepository = {
  user: (userId: string) => UserModel.findById(userId).select('-__v').lean(),

  transactions: (userId: string) => TransactionModel.find({ userId }).lean(),

  categories: (userId: string) => CategoryModel.find({ userId }).lean(),

  budgets: (userId: string) => BudgetModel.find({ userId }).lean(),

  goals: (userId: string) => GoalModel.find({ userId }).lean(),

  netWorth: (userId: string) => NetWorthSnapshotModel.find({ userId }).lean(),

  transactionsSorted: (userId: string) =>
    TransactionModel.find({ userId }).sort({ date: -1 }).lean(),
};
