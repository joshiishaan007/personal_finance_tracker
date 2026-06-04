import { balanceRepository as repo } from './balance.repository';

export interface BalanceSummary {
  total: number;
  openingBalance: number;
  income: number;
  expense: number;
  currency: string;
}

export const balanceService = {
  async get(userId: string): Promise<BalanceSummary> {
    const [totals, meta] = await Promise.all([
      repo.totalsByType(userId),
      repo.userOpeningAndCurrency(userId),
    ]);

    const byType = new Map(totals.map((r) => [String(r._id), Number(r.total) || 0]));
    const income = byType.get('income') ?? 0;
    const expense = byType.get('expense') ?? 0;

    return {
      total: meta.openingBalance + income - expense,
      openingBalance: meta.openingBalance,
      income,
      expense,
      currency: meta.currency,
    };
  },
};
