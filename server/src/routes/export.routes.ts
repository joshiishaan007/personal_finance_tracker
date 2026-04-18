import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { TransactionModel } from '../models/transaction.model';
import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import { UserModel } from '../models/user.model';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/json', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const [user, transactions, categories, budgets, goals, netWorth] = await Promise.all([
    UserModel.findById(userId).select('-__v').lean(),
    TransactionModel.find({ userId }).lean(),
    CategoryModel.find({ userId }).lean(),
    BudgetModel.find({ userId }).lean(),
    GoalModel.find({ userId }).lean(),
    NetWorthSnapshotModel.find({ userId }).lean(),
  ]);

  res.setHeader('Content-Disposition', `attachment; filename="finbuddy-export-${Date.now()}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    transactions,
    categories,
    budgets,
    goals,
    netWorth,
  });
});

router.get('/transactions/csv', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const transactions = await TransactionModel.find({ userId }).sort({ date: -1 }).lean();
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

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.send([header, ...rows].join('\n'));
});

export { router as exportRouter };
