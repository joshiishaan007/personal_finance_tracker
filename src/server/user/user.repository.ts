import { UserModel } from '../models/user.model';
import { TransactionModel } from '../models/transaction.model';
import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import { RecurringRuleModel } from '../models/recurringRule.model';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';
import { NotificationModel } from '../models/notification.model';
import { AIInsightModel } from '../models/aiInsight.model';

export const userRepository = {
  findById: (userId: string) => UserModel.findById(userId),

  updateById: (userId: string, set: Record<string, unknown>) =>
    UserModel.findByIdAndUpdate(userId, { $set: set }, { new: true }).lean(),

  deleteAllData: (userId: string) =>
    Promise.all([
      TransactionModel.deleteMany({ userId }),
      CategoryModel.deleteMany({ userId }),
      BudgetModel.deleteMany({ userId }),
      GoalModel.deleteMany({ userId }),
      RecurringRuleModel.deleteMany({ userId }),
      NetWorthSnapshotModel.deleteMany({ userId }),
      NotificationModel.deleteMany({ userId }),
      AIInsightModel.deleteMany({ userId }),
      UserModel.findByIdAndDelete(userId),
    ]),
};
