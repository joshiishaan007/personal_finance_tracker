import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { UpdatePreferencesSchema } from '@finbuddy/shared';
import { UserModel } from '../models/user.model';
import { TransactionModel } from '../models/transaction.model';
import { CategoryModel } from '../models/category.model';
import { BudgetModel } from '../models/budget.model';
import { GoalModel } from '../models/goal.model';
import { RecurringRuleModel } from '../models/recurringRule.model';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';
import { NotificationModel } from '../models/notification.model';
import { AIInsightModel } from '../models/aiInsight.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.patch('/preferences', validate(UpdatePreferencesSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { timezone, ...prefFields } = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(prefFields)) {
    update[`preferences.${k}`] = v;
  }
  if (timezone) update['timezone'] = timezone;

  const user = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true }).lean();
  res.json({ success: true, data: user });
});

router.delete('/account', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { confirmEmail } = req.body as { confirmEmail?: string };
  const user = await UserModel.findById(userId);
  if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
  if (confirmEmail !== user.email) {
    res.status(400).json({ success: false, error: 'Email confirmation does not match' });
    return;
  }
  await Promise.all([
    TransactionModel.deleteMany({ userId }),
    CategoryModel.deleteMany({ userId }),
    BudgetModel.deleteMany({ userId }),
    GoalModel.deleteMany({ userId }),
    RecurringRuleModel.deleteMany({ userId }),
    NetWorthSnapshotModel.deleteMany({ userId }),
    NotificationModel.deleteMany({ userId }),
    AIInsightModel.deleteMany({ userId }),
    UserModel.findByIdAndDelete(userId),
  ]);
  res.clearCookie('token');
  res.json({ success: true, message: 'Account and all data permanently deleted' });
});

export { router as userRouter };
