import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware — handles security for all requests.
 *
 * 1. Refreshes Supabase auth sessions on every request
 * 2. Protects API routes from external abuse (same-origin + Bearer token)
 * 3. CSRF protection for state-changing methods (POST/PUT/PATCH/DELETE)
 * 4. Request body size limiting (prevents oversized payload attacks)
 * 5. Sets CSRF token cookie on safe requests (GET/HEAD/OPTIONS)
 * 6. Sets additional security headers not covered by next.config.ts
 *
 * SECURITY: Uses exact host matching (not substring) to prevent origin spoofing.
 * Requests without Origin/Referer headers are NOT automatically allowed.
 */

const CSRF_COOKIE = "sunvera-csrf";
const CSRF_HEADER = "x-csrf-token";
const MAX_BODY_SIZE = 1024 * 100; // 100KB
const MAX_IMPORT_BODY_SIZE = 1024 * 1024; // 1MB for import endpoints

async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If Supabase not configured, skip session refresh
  if (!supabaseUrl || !supabaseKey) {
    return { supabaseResponse, supabase: null as unknown };
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired
  await supabase.auth.getUser();

  return { supabaseResponse, supabase };
}

/**
 * Exact same-origin check — prevents substring bypass attacks.
 * Compares the parsed Origin/Referer host against the request host.
 */
function isSameOriginRequest(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;

  // Check Origin header (preferred)
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  // Fall back to Referer header
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // No Origin or Referer header — block by default
  // Direct API calls (curl, Postman, server scripts) must use a Bearer token
  return false;
}

/**
 * CSRF validation — double-submit cookie pattern.
 * Compares cookie token with header token using constant-time comparison.
 */
function validateCSRF(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;

  // Constant-time comparison
  let match = true;
  for (let i = 0; i < cookieToken.length; i++) {
    if (cookieToken[i] !== headerToken[i]) match = false;
  }
  return match;
}

/**
 * Request body size validation
 */
function validateBodySize(req: NextRequest): string | null {
  const contentLength = req.headers.get("content-length");
  if (!contentLength) return null;

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return null;

  // Import endpoints get larger limit
  const isImport = req.nextUrl.pathname.includes("/import");
  const limit = isImport ? MAX_IMPORT_BODY_SIZE : MAX_BODY_SIZE;

  if (size > limit) {
    return `Request body too large (${size} bytes). Maximum: ${limit} bytes.`;
  }

  return null;
}

export async function middleware(req: NextRequest) {
  // Refresh Supabase session
  const { supabaseResponse } = await updateSession(req);

  // Skip static assets
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon")
  ) {
    return supabaseResponse;
  }

  // For non-API GET/HEAD/OPTIONS requests: set CSRF cookie if not present
  const method = req.method.toUpperCase();
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (!req.nextUrl.pathname.startsWith("/api")) {
    // Set CSRF token cookie on non-API pages (for frontend forms)
    if (!supabaseResponse.cookies.get(CSRF_COOKIE)) {
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      supabaseResponse.cookies.set(CSRF_COOKIE, token, {
        httpOnly: false, // Frontend JS needs to read it
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });
    }
    return supabaseResponse;
  }

  // === API PROTECTION ===

  // Body size check (before auth — reject oversized requests immediately)
  const sizeError = validateBodySize(req);
  if (sizeError) {
    return NextResponse.json({ error: sizeError }, { status: 413 });
  }

  // Auth check: Bearer token or same-origin
  const auth = req.headers.get("authorization");
  const validToken = process.env.APP_API_TOKEN;
  const hasBearerToken = validToken && auth === `Bearer ${validToken}`;
  const isSameOrigin = isSameOriginRequest(req);

  if (!hasBearerToken && !isSameOrigin) {
    return NextResponse.json(
      {
        error: validToken
          ? "Unauthorized — provide a valid Bearer token."
          : "External API access is not configured.",
      },
      { status: 401 }
    );
  }

  // CSRF check for state-changing methods (same-origin only — Bearer token bypasses)
  if (isStateChanging && isSameOrigin && !hasBearerToken) {
    if (!validateCSRF(req)) {
      return NextResponse.json(
        { error: "CSRF token missing or invalid." },
        { status: 403 }
      );
    }
  }

  // Add security headers to API responses
  supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  supabaseResponse.headers.set("X-API-Version", "1.0");

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
