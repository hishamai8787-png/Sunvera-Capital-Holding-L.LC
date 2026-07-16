import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/_next") ||
      req.nextUrl.pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api")) {
    const auth = req.headers.get("authorization");
    const validToken = process.env.APP_API_TOKEN;

    if (!validToken || auth !== `Bearer ${validToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
