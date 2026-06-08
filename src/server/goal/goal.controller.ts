import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateGoalSchema, UpdateGoalSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { goalService as svc } from './goal.service';

export const goalController = {
  async list() {
    const { userId } = await requireAuth();
    const goals = await svc.list(userId);
    return ok(goals);
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateGoalSchema, await req.json());
    const goal = await svc.create(userId, data);
    return created(goal);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateGoalSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },
};
