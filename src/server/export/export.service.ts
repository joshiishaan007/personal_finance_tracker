import { exportRepository as repo } from './export.repository';

export const exportService = {
  async buildJson(userId: string) {
    const [user, transactions, categories, budgets, goals, netWorth] = await Promise.all([
      repo.user(userId),
      repo.transactions(userId),
      repo.categories(userId),
      repo.budgets(userId),
      repo.goals(userId),
      repo.netWorth(userId),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      user,
      transactions,
      categories,
      budgets,
      goals,
      netWorth,
    };
  },

  async buildTransactionsCsv(userId: string) {
    const transactions = await repo.transactionsSorted(userId);
    const header = 'date,amount,type,categoryId,note,tags,paymentMethod,isRecurring';
    const rows = transactions.map((t) =>
      [
        t.date.toISOString().split('T')[0],
        t.amount,
        t.type,
        String(t.categoryId),
        `"${(t.note ?? '').replace(/"/g, '""')}"`,
        t.tags.join('|'),
        t.paymentMethod,
        t.isRecurring,
      ].join(',')
    );
    return [header, ...rows].join('\n');
  },
};
