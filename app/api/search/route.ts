import { NextResponse } from "next/server";
import { sanitizeString } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

interface RawResult {
  symbol: string;
  name: string;
  currency: string;
  exchangeFullName: string;
  exchange: string;
}

export async function GET(req: Request) {
  const rl = rateLimitResponse(req, "search");
  if (rl) return rl;

  const key = process.env.FMP_API_KEY;
  const url = new URL(req.url);
  const q = sanitizeString(url.searchParams.get("q") || "", 50);
  if (!key || key.startsWith("PASTE_") || q.length < 1) {
    return NextResponse.json([]);
  }

  const fetchList = async (endpoint: string): Promise<RawResult[]> => {
    try {
      const res = await fetch(
        `https://financialmodelingprep.com/stable/${endpoint}?query=${encodeURIComponent(q)}&limit=10&apikey=${key}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) return [];
      return (await res.json()) as RawResult[];
    } catch {
      return [];
    }
  };

  const [bySymbol, byName] = await Promise.all([
    fetchList("search-symbol"),
    fetchList("search-name"),
  ]);

  const seen = new Set<string>();
  const merged = [...bySymbol, ...byName].filter((r) => {
    if (!r.symbol || seen.has(r.symbol)) return false;
    seen.add(r.symbol);
    return true;
  });

  const score = (r: RawResult) => {
    let s = 0;
    if (["NASDAQ", "NYSE", "AMEX"].includes(r.exchange)) s -= 10;
    if (r.currency === "USD") s -= 5;
    if (!r.symbol.includes(".")) s -= 3;
    if (r.symbol.toUpperCase() === q.toUpperCase()) s -= 20;
    return s;
  };
  merged.sort((a, b) => score(a) - score(b));

  return NextResponse.json(
    merged.slice(0, 7).map((r) => ({
      symbol: r.symbol, name: r.name, exchange: r.exchange, currency: r.currency,
    }))
  );
}
