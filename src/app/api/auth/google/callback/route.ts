import { NextResponse, type NextRequest } from 'next/server';
import { catchAuthCallback } from '@/server/http/catchAuthCallback';
import { getEnv } from '@/server/env';
import { authService } from '@/server/auth/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold start (connectDB) + two Google API round-trips + one DB query can reach
// 8-9s on Vercel Hobby. Give the function 30s so a slow Atlas day or cold start
// never kills the OAuth flow mid-flight.
export const maxDuration = 30;

export const GET = catchAuthCallback(async (req: NextRequest) => {
  const env = getEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  const failed = NextResponse.redirect(`${appUrl}/login?error=auth_failed`);

  const params = req.nextUrl.searchParams;
  const code = params.get('code');
  if (params.get('error') || !code) return failed;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    cache: 'no-store',
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return failed;
  const { access_token: accessToken } = (await tokenRes.json()) as { access_token?: string };
  if (!accessToken) return failed;

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!profileRes.ok) return failed;
  const profile = (await profileRes.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!profile.id || !profile.email) return failed;

  const user = await authService.findOrCreateUser({
    googleId: profile.id,
    email: profile.email,
    name: profile.name ?? profile.email,
    avatar: profile.picture,
  });
  const token = authService.signJWT(user.id, env.JWT_SECRET);

  const res = NextResponse.redirect(`${appUrl}/dashboard`);
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
});
