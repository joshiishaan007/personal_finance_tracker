import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { getOrGenerateInsights } from '../services/ai.service';
import { AIInsightModel } from '../models/aiInsight.model';
import type { Env } from '../config/env';
import type { AuthRequest } from '../middleware/auth.middleware';

export function aiRouter(env: Env): Router {
  const router = Router();
  router.use(requireAuth);

  router.get('/insights', aiRateLimiter, async (req, res) => {
    const { userId } = req as unknown as AuthRequest;
    try {
      const insights = await getOrGenerateInsights(userId, env.GEMINI_API_KEY);
      res.json({ success: true, data: insights ?? null });
    } catch {
      res.json({ success: true, data: null });
    }
  });

  router.post('/insights/dismiss', async (req, res) => {
    const { userId } = req as unknown as AuthRequest;
    await AIInsightModel.findOneAndUpdate(
      { userId, dismissedAt: { $exists: false } },
      { $set: { dismissedAt: new Date() } },
    );
    res.json({ success: true });
  });

  return router;
}
