import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { CreateRecurringRuleSchema, UpdateRecurringRuleSchema } from '@finbuddy/shared';
import { RecurringRuleModel } from '../models/recurringRule.model';
import { TransactionModel } from '../models/transaction.model';
import { createHash } from 'crypto';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

function advanceDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

// Idempotent: generates all due transactions since last run. Call on login.
router.post('/generate', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const rules = await RecurringRuleModel.find({ userId, isActive: true }).lean();
  const now = new Date();
  let generated = 0;

  for (const rule of rules) {
    let current = new Date(rule.nextDueDate);
    while (current <= now) {
      const hash = createHash('sha256')
        .update(`recurring|${String(rule._id)}|${current.toISOString()}`)
        .digest('hex');
      const exists = await TransactionModel.findOne({ userId, hash }).lean();
      if (!exists && rule.autoPost) {
        await TransactionModel.create({
          ...rule.templateTransaction,
          userId,
          date: current,
          isRecurring: true,
          recurringRuleId: rule._id,
          hash,
          schemaVersion: 1,
        });
        generated++;
      }
      current = advanceDate(current, rule.frequency);
    }
    await RecurringRuleModel.findByIdAndUpdate(rule._id, {
      nextDueDate: current,
      lastGeneratedDate: now,
    });
  }

  res.json({ success: true, data: { generated } });
});

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const rules = await RecurringRuleModel.find({ userId })
    .sort({ 'templateTransaction.amount': -1 })
    .lean();
  res.json({ success: true, data: rules });
});

router.post('/', validate(CreateRecurringRuleSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const data = req.body as { nextDueDate: string; [k: string]: unknown };
  const rule = await RecurringRuleModel.create({
    ...data,
    userId,
    nextDueDate: new Date(data.nextDueDate),
  });
  res.status(201).json({ success: true, data: rule });
});

router.patch('/:id', validate(UpdateRecurringRuleSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const rule = await RecurringRuleModel.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: req.body },
    { new: true },
  );
  if (!rule) { res.status(404).json({ success: false, error: 'Rule not found' }); return; }
  res.json({ success: true, data: rule });
});

router.delete('/:id', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await RecurringRuleModel.findOneAndDelete({ _id: req.params.id, userId });
  res.json({ success: true });
});

export { router as recurringRouter };
