import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { TransactionModel } from '../models/transaction.model';
import { BudgetModel } from '../models/budget.model';
import type { AuthRequest } from '../middleware/auth.middleware';
import { Types } from 'mongoose';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { year, month } = req.query as { year: string; month: string };
  const y = parseInt(year), m = parseInt(month);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const [actual, budgets] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: { type: '$type', categoryId: '$categoryId' }, actual: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),
    BudgetModel.find({ userId }).populate('categoryId').lean(),
  ]);

  res.json({ success: true, data: { actual, budgets, year: y, month: m } });
});

export { router as plRouter };
