import { analyticsRepository as repo } from './analytics.repository';

type AggRow = Record<string, unknown>;

// Sum the `total` of a type-grouped aggregation row set for one type (_id === type).
function totalForType(rows: AggRow[], type: string): number {
  const row = rows.find((r) => r._id === type);
  return typeof row?.total === 'number' ? row.total : 0;
}

// Savings rate in basis-point-free percent: (income - expense) / income * 100.
// Money is integer minor units; the ratio is unit-agnostic. 0 income -> 0.
function savingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  return Math.round(((income - expense) / income) * 10000) / 100;
}

export const analyticsService = {
  async dashboard(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [mtd, sixMonth, topCategories, currencyMeta] = await Promise.all([
      repo.mtdByType(userId, monthStart),
      repo.sixMonthByType(userId, sixMonthsAgo),
      repo.topExpenseCategories(userId, monthStart, 3),
      repo.userMeta(userId),
    ]);

    const income = totalForType(mtd, 'income');
    const expense = totalForType(mtd, 'expense');

    return {
      mtd,
      sixMonth,
      topCategories,
      summary: { income, expense, net: income - expense, savingsRate: savingsRate(income, expense) },
      ...currencyMeta,
    };
  },

  async monthly(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [totals, byCategory, byDay, currencyMeta] = await Promise.all([
      repo.totalsByType(userId, start, end),
      repo.expenseByCategory(userId, start, end, 10),
      repo.byDay(userId, start, end),
      repo.userMeta(userId),
    ]);

    const income = totalForType(totals, 'income');
    const expense = totalForType(totals, 'expense');

    return {
      totals,
      byCategory,
      byDay,
      summary: { income, expense, net: income - expense, savingsRate: savingsRate(income, expense) },
      ...currencyMeta,
    };
  },

  async yearly(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [monthly, currencyMeta] = await Promise.all([
      repo.byMonth(userId, start, end),
      repo.userMeta(userId),
    ]);

    return { monthly, ...currencyMeta };
  },

  async monthlyPL(userId: string) {
    const rows = await repo.allTimeMonthlyByType(userId);

    // Build a sorted year-month → {income, expense} map.
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const row of rows) {
      const id = row._id as { year: number; month: number; type: string };
      const key = `${id.year}-${String(id.month).padStart(2, '0')}`;
      const entry = monthMap.get(key) ?? { income: 0, expense: 0 };
      const total = typeof row.total === 'number' ? row.total : 0;
      if (id.type === 'income') entry.income = total;
      else if (id.type === 'expense') entry.expense = total;
      monthMap.set(key, entry);
    }

    const sorted = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let cumulative = 0;
    const months = sorted.map(([key, { income, expense }]) => {
      const [y, m] = key.split('-').map(Number);
      const net = income - expense;
      cumulative += net;
      return {
        label: `${MONTH_ABBR[(m ?? 1) - 1] ?? ''} ${String(y ?? 0).slice(2)}`,
        net,
        cumulative,
        income,
        expense,
      };
    });

    const totalIncome = sorted.reduce((s, [, { income }]) => s + income, 0);
    const totalExpense = sorted.reduce((s, [, { expense }]) => s + expense, 0);

    return { months, cumulative, totalIncome, totalExpense };
  },

  // Old shape: the envelope `data` IS the raw aggregation array. Preserve exactly.
  custom(userId: string, startDate: string, endDate: string) {
    return repo.byTypeAndCategory(userId, new Date(startDate), new Date(endDate));
  },
};
