import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { ok } from '../http/respond';
import { aiService as svc } from './ai.service';

export const aiController = {
  async insights(_req: NextRequest) {
    const { userId } = requireAuth();
    const insights = await svc.getOrGenerate(userId);
    return ok(insights ?? null);
  },

  async dismiss(_req: NextRequest) {
    const { userId } = requireAuth();
    await svc.dismiss(userId);
    return ok({ success: true });
  },
};
