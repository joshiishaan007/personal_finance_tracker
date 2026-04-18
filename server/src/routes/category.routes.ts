import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CreateCategorySchema, UpdateCategorySchema } from '@finbuddy/shared';
import { CategoryModel } from '../models/category.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router: import('express').Router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const categories = await CategoryModel.find({ $or: [{ userId }, { isDefault: true, userId: { $exists: false } }] }).lean();
  res.json({ success: true, data: categories });
});

router.post('/', validate(CreateCategorySchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const cat = await CategoryModel.create({ ...req.body, userId });
  res.status(201).json({ success: true, data: cat });
});

router.patch('/:id', validate(UpdateCategorySchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const cat = await CategoryModel.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: req.body },
    { new: true },
  );
  if (!cat) { res.status(404).json({ success: false, error: 'Category not found' }); return; }
  res.json({ success: true, data: cat });
});

router.delete('/:id', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await CategoryModel.findOneAndDelete({ _id: req.params.id, userId });
  res.json({ success: true });
});

export { router as categoryRouter };
