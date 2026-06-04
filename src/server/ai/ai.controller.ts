import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok, fail } from '../http/respond';
import { QuickParseRequestSchema } from '@/shared';
import { aiService as svc } from './ai.service';

export const aiController = {
  async insights(_req: NextRequest) {
    const { userId } = requireAuth();
    return ok(await svc.getCached(userId)); // read-only, never calls Gemini
  },

  async generate(_req: NextRequest) {
    const { userId } = requireAuth();
    const r = await svc.generate(userId);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async dismiss(_req: NextRequest) {
    const { userId } = requireAuth();
    await svc.dismiss(userId);
    return ok({ success: true });
  },

  async parse(req: NextRequest) {
    const { userId } = requireAuth();
    const { text } = validateBody(QuickParseRequestSchema, await req.json());
    const r = await svc.parseTransaction(userId, text);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },
};
