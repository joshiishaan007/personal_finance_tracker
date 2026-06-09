import { randomBytes, createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { catchRoute } from '@/server/http';
import { getEnv } from '@/server/env';

export const runtime = 'nodejs';
// Per-request redirect to Google — never prerender/cache.
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

const base64url = (b: Buffer) => b.toString('base64url');

export const GET = catchRoute(async () => {
  const env = getEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');

  // CSRF / login-fixation defense: a random state bound to this browser via an
  // httpOnly cookie, plus PKCE (S256) so an intercepted code can't be replayed.
  const state = base64url(randomBytes(16));
  const codeVerifier = base64url(randomBytes(32));
  const codeChallenge = base64url(createHash('sha256').update(codeVerifier).digest());

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  const cookieOpts = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600, // 10 min to complete the round-trip
  };
  res.cookies.set('oauth_state', state, cookieOpts);
  res.cookies.set('oauth_verifier', codeVerifier, cookieOpts);
  return res;
});
