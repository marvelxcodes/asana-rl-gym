import { type NextRequest, NextResponse } from "next/server";

/**
 * Middleware for RL Training Environment
 *
 * Authentication is disabled for RL training purposes.
 * This middleware can be used to inject environment variance
 * or track requests for observation purposes.
 */
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Add RL environment headers
  const response = NextResponse.next();

  // Add custom headers for RL tracking
  response.headers.set("X-RL-Environment", "true");
  response.headers.set("X-RL-Request-Path", pathname);
  response.headers.set("X-RL-Timestamp", Date.now().toString());

  // Allow all routes (no authentication required)
  return response;
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
