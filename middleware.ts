import {
  authMiddleware,
  withAuth,
} from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(req: NextRequest) {
  // Allow access to /settings without authentication
  if (req.nextUrl.pathname === '/settings') {
    return NextResponse.next();
  }

  // Use Kinde's withAuth for all other routes
  return withAuth(req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};