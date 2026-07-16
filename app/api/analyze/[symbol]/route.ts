// JSON API: GET /api/analyze/AAPL — full analysis report.

import { NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/analyze";
import { DataSourceError } from "@/lib/fmp";
import { validateTicker } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const rl = rateLimitResponse(req, "analyze");
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
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof DataSourceError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
