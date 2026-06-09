import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateLifeGoalSchema, UpdateLifeGoalSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { lifeGoalService as svc } from './lifeGoal.service';

export const lifeGoalController = {
  async list() {
    const { userId } = await requireAuth();
    return ok(await svc.list(userId));
  },

  async detail(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.get(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateLifeGoalSchema, await req.json());
    return created(await svc.create(userId, data));
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateLifeGoalSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async summary() {
    const { userId } = await requireAuth();
    return ok(await svc.summary(userId));
  },
};
