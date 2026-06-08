import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok } from '../http/respond';
import { HttpError } from '../http/errors';
import { pushRepository as repo } from './push.repository';
import { z } from 'zod';
import type { NextRequest } from 'next/server';

const SubscribeSchema = z.object({
  endpoint:     z.string().url(),
  subscription: z.string().min(10),
});

const UnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const pushController = {
  async vapidPublicKey(_req: NextRequest) {
    const key = process.env.VAPID_PUBLIC_KEY ?? null;
    if (!key) throw new HttpError(503, 'Push notifications not configured');
    return ok({ publicKey: key });
  },

  async subscribe(req: NextRequest) {
    const { userId } = requireAuth();
    const { endpoint, subscription } = validateBody(SubscribeSchema, await req.json());
    await repo.save(userId, endpoint, subscription);
    return ok({ subscribed: true });
  },

  async unsubscribe(req: NextRequest) {
    const { userId } = requireAuth();
    const { endpoint } = validateBody(UnsubscribeSchema, await req.json());
    await repo.removeByEndpoint(userId, endpoint);
    return ok({ unsubscribed: true });
  },
};
