import { reportsRepository as repo } from './reports.repository';

/**
 * Grading rubric:
 *   savingsRate >= 20% → full savings score
 *   budgetAdherence = % of budgets not exceeded
 *   goalProgress = avg % across active goals
 *   composite = savingsScore*40 + budgetScore*40 + goalScore*20
 *   A=90+ B=80+ C=70+ D=60+ F=<60
 */
export const reportsService = {
  async monthly(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [totals, budgets, goals] = await Promise.all([
      repo.monthlyTotals(userId, start, end),
      repo.budgets(userId),
      repo.activeGoals(userId),
    ]);

    const income = (totals.find((t) => t._id === 'income')?.total as number) ?? 0;
    const expense = (totals.find((t) => t._id === 'expense')?.total as number) ?? 0;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const savingsScore = Math.min((savingsRate / 20) * 100, 100);
    const budgetScore = budgets.length > 0
      ? budgets.reduce((acc) => acc + 100, 0) / budgets.length
      : 100;
    const goalScore = goals.length > 0
      ? goals.reduce((acc, g) => acc + Math.min((g.savedAmount / g.targetAmount) * 100, 100), 0) / goals.length
      : 100;

    const composite = savingsScore * 0.4 + budgetScore * 0.4 + goalScore * 0.2;
    const grade = composite >= 90 ? 'A' : composite >= 80 ? 'B' : composite >= 70 ? 'C' : composite >= 60 ? 'D' : 'F';

    return { grade, composite, savingsRate, savingsScore, budgetScore, goalScore, income, expense, year, month };
  },

  async yearly(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    const [monthly, goals] = await Promise.all([
      repo.yearlyByMonth(userId, start, end),
      repo.achievedGoals(userId),
    ]);

    return { monthly, goalsAchieved: goals.length, year };
  },
};
