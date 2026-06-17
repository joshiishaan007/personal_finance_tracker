import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { catchRoute } from '@/server/http';
import { getEnv } from '@/server/env';
import { authService } from '@/server/auth/auth.service';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/server/auth/authCookies';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

// Exchanges a valid refresh-token cookie for a fresh access+refresh pair (rotated).
// No requireAuth — the access token is expected to be expired here. On any failure
// it 401s and clears both cookies so the client falls back to login.
export const POST = catchRoute(async () => {
  const env = getEnv();
  const raw = cookies().get(REFRESH_COOKIE)?.value;
  if (!raw) {
    const res = NextResponse.json({ success: false, error: 'no_refresh_token' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const r = await authService.rotateRefreshToken(raw, env.JWT_SECRET);
  if (r.state === 'error') {
    const res = NextResponse.json({ success: false, error: 'invalid_refresh_token' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ success: true });
  setAuthCookies(res, {
    accessToken: r.data.accessToken,
    refreshToken: r.data.refreshToken,
    refreshExpiresAt: r.data.refreshExpiresAt,
    secure: env.NODE_ENV === 'production',
  });
  return res;
});
