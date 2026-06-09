import { timingSafeEqual } from 'crypto';
import { catchRoute } from '@/server/http';
import { HttpError } from '@/server/http/errors';
import { getEnv } from '@/server/env';
import { ok } from '@/server/http/respond';
import { pushService } from '@/server/push/push.service';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Constant-time string compare that never throws on length mismatch.
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Vercel Cron invokes this with `Authorization: Bearer <CRON_SECRET>`.
// Fails CLOSED: if CRON_SECRET is unset, or the header is absent/wrong, 401 —
// the endpoint can never fan out pushes unauthenticated. (Bearer-only auth, no
// cookie, so it is immune to CSRF: a cross-site request cannot set this header.)
export const GET = catchRoute(async (req: NextRequest) => {
  const secret = getEnv().CRON_SECRET;
  const header = req.headers.get('authorization') ?? '';
  if (!secret || !safeEqual(header, `Bearer ${secret}`)) {
    throw new HttpError(401, 'Unauthorized');
  }
  const result = await pushService.sendDailyReminder();
  return ok(result);
});
