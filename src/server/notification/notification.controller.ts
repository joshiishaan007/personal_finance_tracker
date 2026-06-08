import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { ok } from '../http/respond';
import type { RouteCtx } from '../http/catchRoute';
import { notificationService as svc } from './notification.service';

export const notificationController = {
  async list() {
    const { userId } = await requireAuth();
    const data = await svc.list(userId);
    return ok(data);
  },

  async readAll() {
    const { userId } = await requireAuth();
    await svc.markAllRead(userId);
    return ok(undefined);
  },

  async read(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    await svc.markRead(userId, String(ctx.params.id));
    return ok(undefined);
  },
};
