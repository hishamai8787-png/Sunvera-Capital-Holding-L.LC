import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware — handles both Supabase session refresh and API protection.
 *
 * 1. Refreshes Supabase auth sessions on every request
 * 2. Protects API routes from external abuse
 * 3. Allows same-origin frontend calls to pass through
 */

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

export async function middleware(req: NextRequest) {
  // Refresh Supabase session
  const { supabaseResponse } = await updateSession(req);

  // Skip non-API paths
  if (
    req.nextUrl.pathname.startsWith("/_next") ||
    req.nextUrl.pathname.startsWith("/favicon")
  ) {
    return supabaseResponse;
  }

  if (!req.nextUrl.pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  // API protection
  const auth = req.headers.get("authorization");
  const validToken = process.env.APP_API_TOKEN;

  // 1. Valid Bearer token always passes
  if (validToken && auth === `Bearer ${validToken}`) {
    return supabaseResponse;
  }

  // 2. Same-origin requests pass (frontend calling its own API)
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const referer = req.headers.get("referer");

  const isSameOrigin =
    (origin && host && (origin.includes(host) || origin === `https://${host}` || origin === `http://${host}`)) ||
    (referer && host && referer.includes(host)) ||
    (!origin && !referer);

  if (isSameOrigin) {
    return supabaseResponse;
  }

  // 3. Block external requests without a token
  return NextResponse.json(
    {
      error: validToken
        ? "Unauthorized — provide a valid Bearer token."
        : "External API access is not configured.",
    },
    { status: 401 }
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
