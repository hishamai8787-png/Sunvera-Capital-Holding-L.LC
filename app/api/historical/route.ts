// GET /api/historical?symbols=EURUSD,GBPUSD,USDJPY&period=1M|3M|6M|1Y|5Y
// Returns normalized price series (first price = 100) for comparison.
// Primary: FMP. Fallback: CoinGecko (crypto), Frankfurter (forex).
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";
import { freeHistoricalForex, freeHistoricalCrypto, COINGECKO_MAP } from "@/lib/freeDataSources";

export const revalidate = 300; // 5 min

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

function normalizeSeries(
  symbol: string,
  prices: { date: string; price: number }[]
): SeriesResult {
  if (prices.length === 0) return { symbol, data: [], error: "No data in range" };
  const basePrice = prices[0].price;
  const normalized: NormalizedPoint[] = prices.map((d) => ({
    date: d.date,
    value: parseFloat(((d.price / basePrice) * 100).toFixed(2)),
    raw: d.price,
  }));
  return {
    symbol,
    data: normalized,
    startPrice: basePrice,
    endPrice: prices[prices.length - 1].price,
    changePercent: parseFloat(
      (((prices[prices.length - 1].price - basePrice) / basePrice) * 100).toFixed(2)
    ),
  };
}

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
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Try FMP first
  if (key && !key.startsWith("PASTE_")) {
    try {
      const results = await Promise.allSettled(
        symbols.map(async (sym): Promise<SeriesResult> => {
          const res = await fetch(
            `https://financialmodelingprep.com/stable/historical-price-eod/light?symbol=${sym}&apikey=${key}`,
            { next: { revalidate: 300 } }
          );
          if (!res.ok) throw new Error(`Failed for ${sym}`);
          const data = (await res.json()) as Array<{ date: string; price: number }>;
          const filtered = data.filter((d) => new Date(d.date) >= cutoff).reverse();
          return normalizeSeries(sym, filtered);
        })
      );

      const series = results.map((r, i) =>
        r.status === "fulfilled" ? r.value : { symbol: symbols[i], data: [], error: "Data unavailable" }
      );

      const hasData = series.some((s) => s.data.length > 0);
      if (hasData) {
        const allDates = series
          .filter((s) => s.data.length > 0)
          .flatMap((s) => s.data.map((d) => d.date));
        const uniqueDates = Array.from(new Set(allDates)).sort();
        return NextResponse.json(
          { period, dates: uniqueDates, series, source: "fmp" },
          { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
        );
      }
    } catch {
      // Fall through to free APIs
    }
  }

  // Fallback: free APIs
  // Determine if symbols are crypto or forex
  const cryptoSymbols = symbols.filter((s) => COINGECKO_MAP[s]);
  const forexSymbols = symbols.filter((s) => s.length === 6 && !COINGECKO_MAP[s]);

  const [cryptoData, forexData] = await Promise.all([
    cryptoSymbols.length > 0 ? freeHistoricalCrypto(cryptoSymbols, days) : Promise.resolve(new Map()),
    forexSymbols.length > 0 ? freeHistoricalForex(forexSymbols, days) : Promise.resolve(new Map()),
  ]);

  const series: SeriesResult[] = symbols.map((sym) => {
    const data = cryptoData.get(sym) ?? forexData.get(sym);
    if (data) return normalizeSeries(sym, data);
    return { symbol: sym, data: [], error: "No free data source available" };
  });

  const allDates = series
    .filter((s) => s.data.length > 0)
    .flatMap((s) => s.data.map((d) => d.date));
  const uniqueDates = Array.from(new Set(allDates)).sort();

  const hasAnyData = series.some((s) => s.data.length > 0);

  return NextResponse.json(
    { period, dates: uniqueDates, series, source: hasAnyData ? "free" : "none" },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  );
}
