import type mongoose from 'mongoose';
import { TransactionModel } from '../models/transaction.model';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import { RecurringRuleModel } from '../models/recurringRule.model';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';
import { NotificationModel } from '../models/notification.model';
import { AIInsightModel } from '../models/aiInsight.model';
import { AuditLogModel } from '../models/auditLog.model';
import { LifeGoalModel } from '../models/lifeGoal.model';
import { ContributionModel } from '../models/contribution.model';
import { TaskModel } from '../models/task.model';

// Production runs with autoIndex:false (db.ts) so cold starts don't issue
// createIndexes round-trips. This migration is the companion that GUARANTEES the
// schema-declared indexes exist in any environment: syncIndexes builds missing
// indexes from each schema (and drops ones no schema declares — the schema is the
// source of truth). Idempotent; safe to re-run.
const models = [
  TransactionModel, UserModel, CategoryModel, BudgetModel, GoalModel,
  RecurringRuleModel, NetWorthSnapshotModel, NotificationModel, AIInsightModel,
  AuditLogModel, LifeGoalModel, ContributionModel, TaskModel,
];

const migration = {
  version: 4,
  description: 'Sync all schema-defined indexes (companion to autoIndex:false in prod)',
  async up(_mongoose: typeof mongoose) {
    for (const model of models) {
      await model.syncIndexes();
    }
  },
};

export default migration;
