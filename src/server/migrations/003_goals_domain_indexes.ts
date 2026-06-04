import type mongoose from 'mongoose';
import { LifeGoalModel } from '../models/lifeGoal.model';
import { ContributionModel } from '../models/contribution.model';
import { TaskModel } from '../models/task.model';

// Ensure the indexes for the new Goals-mode collections. Key patterns match the
// schema-defined indexes' default names, so createIndex is an idempotent no-op
// if Mongoose autoIndex already built them.
const migration = {
  version: 3,
  description: 'Indexes for life-goals, contributions, and tasks',
  async up(_mongoose: typeof mongoose) {
    await LifeGoalModel.collection.createIndex({ userId: 1, status: 1 });
    await ContributionModel.collection.createIndex({ userId: 1, goalId: 1, date: -1 });
    await ContributionModel.collection.createIndex({ userId: 1, date: -1 });
    await TaskModel.collection.createIndex({ userId: 1, done: 1, dueDate: 1 });
    await TaskModel.collection.createIndex({ userId: 1, goalId: 1 });
  },
};

export default migration;
