import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateLoanSchema, UpdateLoanSchema, AddLoanPaymentSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { loanService as svc } from './loan.service';

export const loanController = {
  async list() {
    const { userId } = await requireAuth();
    return ok(await svc.list(userId));
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateLoanSchema, await req.json());
    return created(await svc.create(userId, data));
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateLoanSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async addPayment(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(AddLoanPaymentSchema, await req.json());
    const r = await svc.addPayment(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },
};
