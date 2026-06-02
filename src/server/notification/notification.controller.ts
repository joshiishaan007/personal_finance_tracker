import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { ok } from '../http/respond';
import type { RouteCtx } from '../http/catchRoute';
import { notificationService as svc } from './notification.service';

export const notificationController = {
  async list() {
    const { userId } = requireAuth();
    const data = await svc.list(userId);
    return ok(data);
  },

  async readAll() {
    const { userId } = requireAuth();
    await svc.markAllRead(userId);
    return ok(undefined);
  },

  async read(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    await svc.markRead(userId, String(ctx.params.id));
    return ok(undefined);
  },
};
