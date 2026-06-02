import { GoalModel } from '../models/goal.model';

export const goalRepository = {
  list: (userId: string) => GoalModel.find({ userId }).lean(),

  create: (doc: Record<string, unknown>) => GoalModel.create(doc),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    GoalModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) =>
    GoalModel.findOneAndDelete({ _id: id, userId }).lean(),
};
