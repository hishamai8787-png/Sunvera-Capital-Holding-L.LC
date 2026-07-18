// GET /api/historical?symbols=EURUSD,GBPUSD,USDJPY&period=1M|3M|6M|1Y|5Y
// Returns normalized price series (first price = 100) for comparison
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";

export const revalidate = 300; // 5 min

interface FmpPrice {
  date: string;
  price: number;
}

interface NormalizedPoint {
  date: string;
  value: number;
  raw: number;
}

interface SeriesResult {
  symbol: string;
  data: NormalizedPoint[];
  startPrice?: number;
  endPrice?: number;
  changePercent?: number;
  error?: string;
}

const PERIOD_DAYS: Record<string, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "5Y": 1825,
};

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "historical");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const raw = sanitizeString(searchParams.get("symbols") ?? "", 300);
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 6);

  const period = sanitizeString(searchParams.get("period") ?? "3M", 5).toUpperCase();
  const days = PERIOD_DAYS[period] ?? 90;

  if (symbols.length < 1) {
    return NextResponse.json(
      { error: "Provide at least 1 symbol (max 6)." },
      { status: 400 }
    );
  }

  const key = process.env.FMP_API_KEY;
  if (!key || key.startsWith("PASTE_")) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 503 }
    );
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  try {
    const results = await Promise.allSettled(
      symbols.map(async (sym): Promise<SeriesResult> => {
        const res = await fetch(
          `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${sym}&apikey=${key}`,
          { next: { revalidate: 300 } }
        );
        if (!res.ok) throw new Error(`Failed for ${sym}`);
        const data = (await res.json()) as FmpPrice[];
        // Filter by period and reverse to chronological order
        const filtered = data
          .filter((d) => new Date(d.date) >= cutoff)
          .reverse();

        if (filtered.length === 0) return { symbol: sym, data: [], error: "No data in range" };

        // Normalize: first price = 100
        const basePrice = filtered[0].price;
        const normalized: NormalizedPoint[] = filtered.map((d) => ({
          date: d.date,
          value: parseFloat(((d.price / basePrice) * 100).toFixed(2)),
          raw: d.price,
        }));

        return {
          symbol: sym,
          data: normalized,
          startPrice: basePrice,
          endPrice: filtered[filtered.length - 1].price,
          changePercent: parseFloat(
            (((filtered[filtered.length - 1].price - basePrice) / basePrice) * 100).toFixed(2)
          ),
        };
      })
    );

    const series: SeriesResult[] = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { symbol: symbols[i], data: [], error: "Data unavailable" };
    });

    // Collect all dates across valid series
    const allDates = series
      .filter((s) => s.data.length > 0)
      .flatMap((s) => s.data.map((d) => d.date));
    const uniqueDates = Array.from(new Set(allDates)).sort();

    return NextResponse.json(
      {
        period,
        dates: uniqueDates,
        series,
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[historical] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Historical data fetch failed." },
      { status: 500 }
    );
  }
}
