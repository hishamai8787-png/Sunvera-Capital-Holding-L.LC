// JSON API: GET /api/analyze/AAPL — full analysis report.
// Cached for 5 minutes to reduce external API calls.

import { NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/analyze";
import { DataSourceError } from "@/lib/fmp";
import { validateTicker } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

export const revalidate = 300; // 5 minutes

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const rl = await rateLimitResponse(req, "analyze");
  if (rl) return rl;

  const { symbol: rawSymbol } = await params;
  const symbol = validateTicker(rawSymbol);
  if (!symbol) {
    return NextResponse.json(
      { error: "Invalid ticker symbol. Use 1-6 uppercase letters." },
      { status: 400 }
    );
  }

  try {
    const report = await analyzeCompany(symbol);
    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    console.error("[analyze] Error:", err instanceof Error ? err.message : String(err));
    if (err instanceof DataSourceError) {
      return NextResponse.json(
        { error: "Unable to retrieve data from the data source. Please try again later." },
        { status: err.status ?? 502 }
      );
    }
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
