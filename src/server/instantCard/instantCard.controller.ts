import { instantCardService as svc } from './instantCard.service';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { CreateInstantCardSchema } from '@/shared';
import type { NextRequest } from 'next/server';
import type { RouteCtx } from '../http/catchRoute';

export const instantCardController = {
  async list(_req: NextRequest) {
    const { userId } = await requireAuth();
    const cards = await svc.list(userId);
    return ok(
      cards.map((c) => ({
        _id:           String(c._id),
        amount:        c.amount,
        type:          c.type,
        categoryId:    c.categoryId,
        paymentMethod: c.paymentMethod,
        note:          c.note,
        tags:          c.tags,
      })),
    );
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const body = validateBody(CreateInstantCardSchema, await req.json());
    const card = await svc.create(userId, body);
    return created({
      _id:           String(card._id),
      amount:        card.amount,
      type:          card.type,
      categoryId:    card.categoryId,
      paymentMethod: card.paymentMethod,
      note:          card.note,
      tags:          card.tags,
    });
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const result = await svc.remove(userId, String(ctx.params.id));
    return result.state === 'ok' ? ok(result.data) : fail(result.reason);
  },
};
