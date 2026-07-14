// JSON API: GET /api/analyze/AAPL — full analysis report.
// This is the same engine the web UI uses; later iOS/Android apps can call it directly.

import { NextResponse } from "next/server";
import { analyzeCompany } from "@/lib/analyze";
import { DataSourceError } from "@/lib/fmp";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  try {
    const report = await analyzeCompany(symbol);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    const status = err instanceof DataSourceError ? (err.status ?? 502) : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
