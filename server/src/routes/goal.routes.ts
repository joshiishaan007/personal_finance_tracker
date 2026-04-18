import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CreateGoalSchema, UpdateGoalSchema } from '@finbuddy/shared';
import { GoalModel } from '../models/goal.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const goals = await GoalModel.find({ userId }).lean();
  res.json({ success: true, data: goals });
});

router.post('/', validate(CreateGoalSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const data = req.body as { deadline?: string; [k: string]: unknown };
  const goal = await GoalModel.create({
    ...data,
    userId,
    deadline: data.deadline ? new Date(data.deadline) : undefined,
  });
  res.status(201).json({ success: true, data: goal });
});

router.patch('/:id', validate(UpdateGoalSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const data = req.body as { deadline?: string; [k: string]: unknown };
  const update = { ...data, ...(data.deadline && { deadline: new Date(data.deadline) }) };
  const goal = await GoalModel.findOneAndUpdate({ _id: req.params.id, userId }, { $set: update }, { new: true });
  if (!goal) { res.status(404).json({ success: false, error: 'Goal not found' }); return; }
  res.json({ success: true, data: goal });
});

router.delete('/:id', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await GoalModel.findOneAndDelete({ _id: req.params.id, userId });
  res.json({ success: true });
});

export { router as goalRouter };
