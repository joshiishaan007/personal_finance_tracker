import { NextResponse, type NextRequest } from 'next/server';
import { connectDB } from '../db';
import { getEnv } from '../env';
import { logger } from '../logger';

// Specialized route wrapper for the Google OAuth callback.
//
// The callback is a BROWSER redirect flow, not a JSON API endpoint — every
// response MUST be a redirect. catchRoute (the standard wrapper) returns a
// JSON { success:false } envelope on unhandled errors, which shows as a raw
// JSON blob in the browser instead of sending the user back to the login page.
//
// This wrapper mirrors catchRoute's responsibilities (connectDB + error
// boundary) but maps any error to a redirect to /login?error=auth_failed.
export function catchAuthCallback(
  handler: (req: NextRequest) => Promise<Response>,
) {
  return async (req: NextRequest): Promise<Response> => {
    const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
    const failed = NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
    try {
      await connectDB();
      return await handler(req);
    } catch (err) {
      logger.error({ err }, 'OAuth callback error');
      return failed;
    }
  };
}
