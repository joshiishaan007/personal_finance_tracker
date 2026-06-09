import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateCategorySchema, UpdateCategorySchema } from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { categoryService as svc } from './category.service';

export const categoryController = {
  async list() {
    const { userId } = await requireAuth();
    const categories = await svc.list(userId);
    return ok(categories);
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateCategorySchema, await req.json());
    const cat = await svc.create(userId, data);
    return created(cat);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateCategorySchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Category not found');
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason, 'Category not found');
  },
};
