// GET /api/quote/AAPL — real-time quote for the watchlist.
// Prefers Finnhub (real-time on free tier); falls back to FMP.

import { NextResponse } from "next/server";
import { getRealtimeQuote } from "@/lib/finnhub";
import { getQuote } from "@/lib/fmp";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).trim().toUpperCase();

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
    });
  }

  try {
    const q = await getQuote(sym);
    return NextResponse.json({
      symbol: sym,
      price: q.price,
      change: q.change,
      changePercent: q.changePercentage,
      high: q.yearHigh,
      low: q.yearLow,
      previousClose: q.previousClose,
      source: "fmp",
    });
  } catch {
    return NextResponse.json({ error: `No quote for ${sym}` }, { status: 404 });
  }
}
