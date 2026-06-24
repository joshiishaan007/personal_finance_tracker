import { LifeGoalModel } from '../models/lifeGoal.model';

export const lifeGoalRepository = {
  list: (userId: string) => LifeGoalModel.find({ userId }).sort({ createdAt: -1 }).lean(),

  findById: (userId: string, id: string) => LifeGoalModel.findOne({ _id: id, userId }).lean(),

  create: (doc: Record<string, unknown>) => LifeGoalModel.create(doc),

  update: (userId: string, id: string, patch: Record<string, unknown>) => {
    // A null/undefined value clears the field ($unset); a real value writes it ($set).
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ''> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined) $unset[k] = '';
      else $set[k] = v;
    }
    const update: Record<string, unknown> = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;
    return LifeGoalModel.findOneAndUpdate({ _id: id, userId }, update, { new: true }).lean();
  },

  remove: (userId: string, id: string) =>
    LifeGoalModel.findOneAndDelete({ _id: id, userId }).lean(),

  // Atomic progress bump when a contribution is logged/removed.
  incCurrentValue: (userId: string, id: string, delta: number) =>
    LifeGoalModel.findOneAndUpdate({ _id: id, userId }, { $inc: { currentValue: delta } }, { new: true }).lean(),
};
