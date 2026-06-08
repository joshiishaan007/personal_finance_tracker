import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { ok } from '../http/respond';
import { engagementService as svc } from './engagement.service';

export const engagementController = {
  async daily(_req: NextRequest) {
    const { userId } = await requireAuth();
    return ok(await svc.daily(userId));
  },
};
