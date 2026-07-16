import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — protects API routes from external abuse while allowing
 * the app's own frontend to call them freely.
 *
 * Strategy:
 *  - Requests with a valid Bearer token (APP_API_TOKEN) always pass.
 *  - Same-origin requests (matching the deployment's host) pass — this
 *    covers all frontend fetch() calls.
 *  - Everything else gets 401.
 *
 * When APP_API_TOKEN is not set, same-origin requests still pass and
 * external requests are blocked with a clear message.
 */

export function middleware(req: NextRequest) {
  // Skip non-API paths entirely
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  const validToken = process.env.APP_API_TOKEN;

  // 1. Valid Bearer token always passes (programmatic API access)
  if (validToken && auth === `Bearer ${validToken}`) {
    return NextResponse.next();
  }

  // 2. Same-origin requests pass (frontend calling its own API)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const referer = req.headers.get("referer");

  // In production, origin/host will match. In dev, localhost variants match.
  const isSameOrigin =
    (origin && host && (origin.includes(host) || origin === `https://${host}` || origin === `http://${host}`)) ||
    (referer && host && (referer.includes(host))) ||
    (!origin && !referer); // server-side fetch within Next.js has no origin/referer

  if (isSameOrigin) {
    return NextResponse.next();
  }

  // 3. Block external requests without a token
  return NextResponse.json(
    {
      error: validToken
        ? "Unauthorized — provide a valid Bearer token."
        : "External API access is not configured. Set APP_API_TOKEN to enable programmatic access.",
    },
    { status: 401 }
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
