import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok } from '../http/respond';
import { UpsertNetWorthSchema } from '@/shared';
import { netWorthService as svc } from './netWorth.service';

export const netWorthController = {
  async list() {
    const { userId } = await requireAuth();
    const snapshots = await svc.list(userId);
    return ok(snapshots);
  },

  async latest() {
    const { userId } = await requireAuth();
    const snapshot = await svc.latest(userId);
    return ok(snapshot);
  },

  async upsert(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(UpsertNetWorthSchema, await req.json());
    const snapshot = await svc.upsert(userId, data);
    return ok(snapshot);
  },
};
