import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateInvestmentSchema, UpdateInvestmentSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { investmentService as svc } from './investment.service';

export const investmentController = {
  async list() {
    const { userId } = requireAuth();
    const investments = await svc.list(userId);
    return ok(investments);
  },

  async create(req: NextRequest) {
    const { userId } = requireAuth();
    const data = validateBody(CreateInvestmentSchema, await req.json());
    const investment = await svc.create(userId, data);
    return created(investment);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const data = validateBody(UpdateInvestmentSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Investment not found');
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Investment not found');
  },
};
