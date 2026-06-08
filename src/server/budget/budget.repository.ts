import { BudgetModel } from '../models/budget.model';

export const budgetRepository = {
  list: (userId: string) => BudgetModel.find({ userId }).populate('categoryId').lean(),

  findByCategory: (userId: string, categoryId: string) =>
    BudgetModel.findOne({ userId, categoryId }).lean().exec(),

  updateAlerts: (id: string, set: Record<string, unknown>) =>
    BudgetModel.findByIdAndUpdate(id, { $set: set }).lean().exec(),

  // Upsert keyed on the unique { userId, categoryId } pair.
  upsert: (userId: string, categoryId: string, set: Record<string, unknown>) =>
    BudgetModel.findOneAndUpdate(
      { userId, categoryId },
      { $set: set },
      { upsert: true, new: true },
    ),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    BudgetModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }),

  remove: (userId: string, id: string) =>
    BudgetModel.findOneAndDelete({ _id: id, userId }).lean(),
};
