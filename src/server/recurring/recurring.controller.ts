import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateRecurringRuleSchema, UpdateRecurringRuleSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { recurringService as svc } from './recurring.service';

export const recurringController = {
  async list() {
    const { userId } = requireAuth();
    const rules = await svc.list(userId);
    return ok(rules);
  },

  async create(req: NextRequest) {
    const { userId } = requireAuth();
    const data = validateBody(CreateRecurringRuleSchema, await req.json());
    const rule = await svc.create(userId, data);
    return created(rule);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const data = validateBody(UpdateRecurringRuleSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async generate() {
    const { userId } = requireAuth();
    const result = await svc.generate(userId);
    return ok(result);
  },
};
