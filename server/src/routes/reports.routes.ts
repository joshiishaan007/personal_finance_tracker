import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { TransactionModel } from '../models/transaction.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import type { AuthRequest } from '../middleware/auth.middleware';
import { Types } from 'mongoose';

const router = Router();
router.use(requireAuth);

/**
 * Grading rubric:
 *   savingsRate >= 20% → full savings score
 *   budgetAdherence = % of budgets not exceeded
 *   goalProgress = avg % across active goals
 *   composite = savingsScore*40 + budgetScore*40 + goalScore*20
 *   A=90+ B=80+ C=70+ D=60+ F=<60
 */
router.get('/monthly', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { year, month } = req.query as { year: string; month: string };
  const y = parseInt(year), m = parseInt(month);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const [totals, budgets, goals] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    BudgetModel.find({ userId }).lean(),
    GoalModel.find({ userId, status: 'active' }).lean(),
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

  res.json({
    success: true,
    data: { grade, composite, savingsRate, savingsScore, budgetScore, goalScore, income, expense, year: y, month: m },
  });
});

router.get('/yearly', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { year } = req.query as { year: string };
  const y = parseInt(year);
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);

  const [monthly, goals] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
      { $sort: { '_id.month': 1 } },
    ]),
    GoalModel.find({ userId, status: 'achieved' }).lean(),
  ]);

  res.json({ success: true, data: { monthly, goalsAchieved: goals.length, year: y } });
});

export { router as reportsRouter };
