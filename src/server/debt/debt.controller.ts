import { debtService as svc } from './debt.service';
import { requireAuth } from '../http/requireAuth';
import { validateBody, validateQuery } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateDebtSchema, UpdateDebtSchema, DebtFilterSchema } from '@/shared';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import type { RouteCtx } from '../http/catchRoute';

const CreateDebtsSchema = z.array(CreateDebtSchema).min(1).max(20);

export const debtController = {
  async list(req: NextRequest) {
    const { userId } = requireAuth();
    const filter = validateQuery(DebtFilterSchema, req);
    return ok(await svc.list(userId, filter));
  },

  async summary(_req: NextRequest) {
    const { userId } = requireAuth();
    return ok(await svc.summary(userId));
  },

  async create(req: NextRequest) {
    const { userId } = requireAuth();
    const debts = validateBody(CreateDebtsSchema, await req.json());
    await svc.createMany(userId, debts);
    return created({ created: debts.length });
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const data = validateBody(UpdateDebtSchema, await req.json());
    const result = await svc.update(userId, String(ctx.params.id), data);
    return result.state === 'ok' ? ok(result.data) : fail(result.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const result = await svc.remove(userId, String(ctx.params.id));
    return result.state === 'ok' ? ok(result.data) : fail(result.reason);
  },

  async cleanup(_req: NextRequest) {
    const { userId } = requireAuth();
    return ok(await svc.cleanupOldSettled(userId));
  },
};
