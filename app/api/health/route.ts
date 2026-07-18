import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: !!process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "not_configured",
      auth: !!process.env.NEXTAUTH_SECRET ? "configured" : "not_configured",
      fmp: !!process.env.FMP_API_KEY ? "configured" : "not_configured",
      finnhub: !!process.env.FINNHUB_API_KEY ? "configured" : "not_configured",
      sentry: !!process.env.SENTRY_DSN ? "configured" : "not_configured",
      redis: !!process.env.UPSTASH_REDIS_REST_URL ? "configured" : "not_configured",
    },
    version: process.env.npm_package_version || "1.0.0",
  });
}
