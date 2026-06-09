import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok } from '../http/respond';
import { UpdateSpendingPlanSchema } from '@/shared';
import { spendingPlanService as svc } from './spendingPlan.service';

export const spendingPlanController = {
  async get() {
    const { userId } = await requireAuth();
    return ok(await svc.view(userId));
  },

  async update(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateSpendingPlanSchema, await req.json());
    return ok(await svc.update(userId, data));
  },
};
