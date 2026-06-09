import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '../db';
import { logger } from '../logger';
import { getEnv } from '../env';
import { HttpError } from './errors';

export type RouteCtx = { params: Record<string, string | string[]> };

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// CSRF defense-in-depth (beyond the SameSite=lax cookie): for state-changing
// methods, if a browser Origin header is present it MUST match an allowed origin
// (the request's own host or the configured app URL). A cross-site forged
// request carries a foreign Origin and is rejected. Origin-less requests (server
// tools) pass — they don't carry the victim's session cookie cross-site anyway.
function assertSameOrigin(req: NextRequest): void {
  if (!MUTATING.has(req.method)) return;
  const origin = req.headers.get('origin');
  if (!origin) return;
  const allowed = new Set([req.nextUrl.origin]);
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  try { allowed.add(new URL(appUrl).origin); } catch { /* malformed env URL — ignore */ }
  if (!allowed.has(origin)) throw new HttpError(403, 'Cross-origin request blocked');
}

// The ONE and only catch for backend feature code. Ensures the DB connection,
// runs the handler, and maps any thrown error to the { success:false } envelope.
// Controllers/services/repositories contain ZERO try/catch. Generic over the
// route context so dynamic-segment params ([id], [batchId]) flow through.
export function catchRoute<C extends RouteCtx>(
  handler: (req: NextRequest, ctx: C) => Promise<Response> | Response,
) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    try {
      assertSameOrigin(req);
      await connectDB();
      return await handler(req, ctx);
    } catch (e) {
      const err = e as { name?: string; message?: string };

      if (e instanceof HttpError) {
        return NextResponse.json({ success: false, error: err.message }, { status: e.status });
      }
      // Invalid ObjectId in a path param -> treat as not found, not a 500.
      if (err.name === 'CastError') {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      if (err.name === 'ValidationError' || err.name === 'ZodError') {
        return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 });
      }

      logger.error({ err: e }, 'Unhandled route error');
      const msg = process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message ?? 'Error');
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  };
}
