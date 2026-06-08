import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody, validateQuery } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateContributionSchema, ContributionFilterSchema, ContributionHeatmapQuerySchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { contributionService as svc } from './contribution.service';

export const contributionController = {
  async list(req: NextRequest) {
    const { userId } = await requireAuth();
    const { goalId } = validateQuery(ContributionFilterSchema, req);
    if (!goalId) return ok([]); // contributions are always viewed per goal
    return ok(await svc.listByGoal(userId, goalId));
  },

  async heatmap(req: NextRequest) {
    const { userId } = await requireAuth();
    const { goalId, from, to } = validateQuery(ContributionHeatmapQuerySchema, req);
    const days = await svc.heatmap(userId, new Date(from), new Date(to), goalId);
    const peak = days.length > 0 ? Math.max(...days.map((d) => d.value)) : 1;
    return ok({ days, peak });
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateContributionSchema, await req.json());
    return created(await svc.create(userId, data));
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },
};
