import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { NotificationModel } from '../models/notification.model';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const [notifications, unread] = await Promise.all([
    NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
    NotificationModel.countDocuments({ userId, read: false }),
  ]);
  res.json({ success: true, data: { notifications, unread } });
});

router.patch('/read-all', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await NotificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
  res.json({ success: true });
});

router.patch('/:id/read', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  await NotificationModel.findOneAndUpdate({ _id: req.params.id, userId }, { $set: { read: true } });
  res.json({ success: true });
});

export { router as notificationRouter };
