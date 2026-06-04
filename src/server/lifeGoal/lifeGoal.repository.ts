import { LifeGoalModel } from '../models/lifeGoal.model';

export const lifeGoalRepository = {
  list: (userId: string) => LifeGoalModel.find({ userId }).sort({ createdAt: -1 }).lean(),

  findById: (userId: string, id: string) => LifeGoalModel.findOne({ _id: id, userId }).lean(),

  create: (doc: Record<string, unknown>) => LifeGoalModel.create(doc),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    LifeGoalModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) =>
    LifeGoalModel.findOneAndDelete({ _id: id, userId }).lean(),

  // Atomic progress bump when a contribution is logged/removed.
  incCurrentValue: (userId: string, id: string, delta: number) =>
    LifeGoalModel.findOneAndUpdate({ _id: id, userId }, { $inc: { currentValue: delta } }, { new: true }).lean(),
};
