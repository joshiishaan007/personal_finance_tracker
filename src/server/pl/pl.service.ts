import { plRepository as repo } from './pl.repository';
import { analyticsRepository } from '../analytics/analytics.repository';

type AggRow = Record<string, unknown>;

// Build actual-vs-budget comparison per category. Money is integer minor units.
function compare(actual: AggRow[], budgets: readonly AggRow[]): AggRow[] {
  const spentByCategory = new Map<string, number>();
  for (const row of actual) {
    const id = row._id as { type?: string; categoryId?: unknown } | undefined;
    if (id?.type !== 'expense' || id.categoryId == null) continue;
    const key = String(id.categoryId);
    const amount = typeof row.actual === 'number' ? row.actual : 0;
    spentByCategory.set(key, (spentByCategory.get(key) ?? 0) + amount);
  }
  return budgets.map((b) => {
    const cat = b.categoryId as { _id?: unknown } | unknown;
    const categoryId = cat && typeof cat === 'object' && '_id' in cat ? (cat as { _id: unknown })._id : b.categoryId;
    const budgeted = typeof b.amount === 'number' ? b.amount : 0;
    const spent = spentByCategory.get(String(categoryId)) ?? 0;
    return { categoryId, budgeted, spent, remaining: budgeted - spent };
  });
}

export const plService = {
  async report(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [actual, budgets, currencyMeta] = await Promise.all([
      repo.actualByTypeAndCategory(userId, start, end),
      repo.budgets(userId),
      analyticsRepository.userMeta(userId),
    ]);

    return { actual, budgets, year, month, comparison: compare(actual, budgets), ...currencyMeta };
  },
};
