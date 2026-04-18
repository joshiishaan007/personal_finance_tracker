import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CreateBudgetSchema, UpdateBudgetSchema } from '@finbuddy/shared';
import { BudgetModel } from '../models/budget.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router: import('express').Router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const budgets = await BudgetModel.find({ userId }).populate('categoryId').lean();
  res.json({ success: true, data: budgets });
});

router.post('/', validate(CreateBudgetSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const data = req.body as { categoryId: string; startDate: string; [k: string]: unknown };
  const budget = await BudgetModel.findOneAndUpdate(
    { userId, categoryId: data.categoryId },
    { $set: { ...data, userId, startDate: new Date(data.startDate) } },
    { upsert: true, new: true },
  );
  res.status(201).json({ success: true, data: budget });
});

router.patch('/:id', validate(UpdateBudgetSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const budget = await BudgetModel.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: req.body },
    { new: true },
  );
  if (!budget) { res.status(404).json({ success: false, error: 'Budget not found' }); return; }
  res.json({ success: true, data: budget });
});

router.delete('/:id', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await BudgetModel.findOneAndDelete({ _id: req.params.id, userId });
  res.json({ success: true });
});

export { router as budgetRouter };
