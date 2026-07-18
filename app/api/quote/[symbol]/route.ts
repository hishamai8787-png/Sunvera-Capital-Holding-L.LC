// GET /api/quote/AAPL — real-time quote for the watchlist.
// Prefers Finnhub (real-time on free tier); falls back to FMP.
// Cached for 30 seconds to reduce API calls.

import { NextResponse } from "next/server";
import { getRealtimeQuote } from "@/lib/finnhub";
import { getQuote } from "@/lib/fmp";
import { rateLimitResponse } from "@/lib/rateLimit";

export const revalidate = 30;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const rl = await rateLimitResponse(req, "quote");
  if (rl) return rl;

  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).trim().toUpperCase();

  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  };

  const fh = await getRealtimeQuote(sym);
  if (fh) {
    return NextResponse.json({
      symbol: sym,
      price: fh.c,
      change: fh.d,
      changePercent: fh.dp,
      high: fh.h,
      low: fh.l,
      previousClose: fh.pc,
      source: "finnhub",
    }, { headers: cacheHeaders });
  }

  try {
    const q = await getQuote(sym);
    if (q) {
      return NextResponse.json({
        symbol: sym,
        price: q.price,
        change: q.change,
        changePercent: q.changePercentage,
        previousClose: q.previousClose ?? 0,
        source: "fmp",
      }, { headers: cacheHeaders });
    }
  } catch {
    // fall through to error
  }

  return NextResponse.json({ error: "Quote unavailable" }, { status: 502 });
}
