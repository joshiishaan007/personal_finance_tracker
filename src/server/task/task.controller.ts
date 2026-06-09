import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody, validateQuery } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateTaskSchema, UpdateTaskSchema, TaskFilterSchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { taskService as svc } from './task.service';

export const taskController = {
  async list(req: NextRequest) {
    const { userId } = await requireAuth();
    const filter = validateQuery(TaskFilterSchema, req);
    return ok(await svc.list(userId, filter));
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateTaskSchema, await req.json());
    return created(await svc.create(userId, data));
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateTaskSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },
};
