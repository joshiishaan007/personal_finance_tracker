import { NextResponse } from 'next/server';
import { catchRoute } from '@/server/http';
import { getEnv } from '@/server/env';

export const runtime = 'nodejs';
// Per-request redirect to Google — never prerender/cache.
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

export const GET = catchRoute(async () => {
  const env = getEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});
