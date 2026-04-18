import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { UpsertNetWorthSchema } from '@finbuddy/shared';
import { NetWorthSnapshotModel } from '../models/netWorthSnapshot.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const snapshots = await NetWorthSnapshotModel.find({ userId }).sort({ date: -1 }).limit(36).lean();
  res.json({ success: true, data: snapshots });
});

router.get('/latest', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const snapshot = await NetWorthSnapshotModel.findOne({ userId }).sort({ date: -1 }).lean();
  res.json({ success: true, data: snapshot });
});

router.post('/', validate(UpsertNetWorthSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { assets, liabilities } = req.body as { assets: Record<string, number>; liabilities: Record<string, number> };
  const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
  const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
  const netWorth = totalAssets - totalLiabilities;
  const now = new Date();
  const monthKey = new Date(now.getFullYear(), now.getMonth(), 1);

  const snapshot = await NetWorthSnapshotModel.findOneAndUpdate(
    { userId, date: monthKey },
    { $set: { assets, liabilities, netWorth } },
    { upsert: true, new: true },
  );
  res.json({ success: true, data: snapshot });
});

export { router as netWorthRouter };
