import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateBudgetSchema, UpdateBudgetSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { budgetService as svc } from './budget.service';

export const budgetController = {
  async list() {
    const { userId } = await requireAuth();
    const budgets = await svc.list(userId);
    return ok(budgets);
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateBudgetSchema, await req.json());
    const budget = await svc.create(userId, data);
    return created(budget);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateBudgetSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Budget not found');
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Budget not found');
  },
};
