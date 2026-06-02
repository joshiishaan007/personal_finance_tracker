import { NextResponse, type NextRequest } from 'next/server';

// Presence check only — full JWT verification stays in requireAuth on the node
// handlers. This just bounces visitors with no cookie off protected app pages.
export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has('token');
  if (!hasToken) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Match every path EXCEPT /login, /api/*, /_next/*, and files with an extension.
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
