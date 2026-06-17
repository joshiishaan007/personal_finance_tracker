import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';

// A cross-cutting reader/writer like export.repository — owns the merge-restore
// queries for the collections a backup carries (transactions go through the
// transaction repository so its hash-dedup stays the single source of truth).
export const importRepository = {
  userCategories: (userId: string) =>
    CategoryModel.find({ userId }, { name: 1, type: 1 }).lean(),

  insertCategories: (docs: Record<string, unknown>[]) => CategoryModel.insertMany(docs),

  budgetCategoryIds: async (userId: string): Promise<Set<string>> => {
    const rows = await BudgetModel.find({ userId }, { categoryId: 1 }).lean();
    return new Set(rows.map((r) => String(r.categoryId)));
  },

  insertBudgets: (docs: Record<string, unknown>[]) => BudgetModel.insertMany(docs),

  goalTitles: async (userId: string): Promise<Set<string>> => {
    const rows = await GoalModel.find({ userId }, { title: 1 }).lean();
    return new Set(rows.map((r) => r.title.toLowerCase()));
  },

  insertGoals: (docs: Record<string, unknown>[]) => GoalModel.insertMany(docs),
};
