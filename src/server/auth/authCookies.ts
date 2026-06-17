import type { NextResponse } from 'next/server';

// Single source of truth for the auth cookies so the callback, refresh and logout
// routes all set/clear them identically.
const ACCESS_COOKIE = 'token';
export const REFRESH_COOKIE = 'refresh_token';
const ACCESS_MAX_AGE = 30 * 60; // 30 min — matches the access-token TTL
// Refresh cookie is only ever sent to /api/auth/* (refresh + logout), shrinking
// its exposure surface vs the access cookie which must ride every request.
const REFRESH_PATH = '/api/auth';

export function setAuthCookies(
  res: NextResponse,
  opts: { accessToken: string; refreshToken: string; refreshExpiresAt: Date; secure: boolean },
): void {
  res.cookies.set(ACCESS_COOKIE, opts.accessToken, {
    httpOnly: true, secure: opts.secure, sameSite: 'lax', path: '/', maxAge: ACCESS_MAX_AGE,
  });
  const refreshMaxAge = Math.max(0, Math.floor((opts.refreshExpiresAt.getTime() - Date.now()) / 1000));
  res.cookies.set(REFRESH_COOKIE, opts.refreshToken, {
    httpOnly: true, secure: opts.secure, sameSite: 'lax', path: REFRESH_PATH, maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: REFRESH_PATH, maxAge: 0 });
}
