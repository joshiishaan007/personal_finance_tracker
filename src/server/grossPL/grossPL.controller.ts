import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateGrossPLSchema, UpdateGrossPLSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { grossPLService as svc } from './grossPL.service';

export const grossPLController = {
  async list() {
    const { userId } = requireAuth();
    const summary = await svc.list(userId);
    return ok(summary);
  },

  async create(req: NextRequest) {
    const { userId } = requireAuth();
    const data = validateBody(CreateGrossPLSchema, await req.json());
    const entry = await svc.create(userId, data);
    return created(entry);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const data = validateBody(UpdateGrossPLSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Entry not found');
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Entry not found');
  },
};
