import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { catchRoute } from '@/server/http';
import { authService } from '@/server/auth/auth.service';
import { clearAuthCookies, REFRESH_COOKIE } from '@/server/auth/authCookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

// No requireAuth: logout must succeed even when the access token has expired.
// The refresh cookie identifies the user; we bump tokenVersion + revoke every
// refresh token (all devices), then clear both cookies.
export const POST = catchRoute(async () => {
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (raw) await authService.logout(raw);
  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return res;
});
