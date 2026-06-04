import { NextResponse } from 'next/server';
import { catchRoute, requireAuth } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

export const POST = catchRoute(async () => {
  requireAuth();
  const res = NextResponse.json({ success: true });
  res.cookies.set('token', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
});
