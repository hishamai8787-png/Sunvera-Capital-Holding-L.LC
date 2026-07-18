// Free data sources that don't require API keys.
// Used as fallback when FMP_API_KEY is not configured.

interface FreeQuote {
  symbol: string;
  price: number;
  change: number | null;
  changePercent: number | null;
  source: string;
}

// CoinGecko coin ID mapping for crypto symbols
export const COINGECKO_MAP: Record<string, string> = {
  BTCUSD: "bitcoin",
  ETHUSD: "ethereum",
  BNBUSD: "binancecoin",
  XRPUSD: "ripple",
  SOLUSD: "solana",
  ADAUSD: "cardano",
  DOGEUSD: "dogecoin",
  AVAXUSD: "avalanche-2",
  DOTUSD: "polkadot",
  MATICUSD: "matic-network",
  LINKUSD: "chainlink",
  LTCUSD: "litecoin",
};

// Gold-API.com metal mapping
const METAL_MAP: Record<string, string> = {
  XAUUSD: "XAU",
  XAGUSD: "XAG",
  XPTUSD: "XPT",
  XPDUSD: "XPD",
};

// Forex currency code extraction from pair (EURUSD -> EUR, USD)
function pairToCurrencies(symbol: string): { from: string; to: string } | null {
  if (symbol.length === 6) {
    return { from: symbol.slice(0, 3), to: symbol.slice(3) };
  }
  return null;
}

// Fetch crypto quotes from CoinGecko (free, no key)
async function fetchCryptoQuotes(symbols: string[]): Promise<Map<string, FreeQuote>> {
  const result = new Map<string, FreeQuote>();
  const ids = symbols
    .map((s) => ({ symbol: s, id: COINGECKO_MAP[s] }))
    .filter((s) => s.id);

  if (ids.length === 0) return result;

  try {
    const idList = ids.map((s) => s.id).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idList}&vs_currencies=usd&include_24hr_change=true`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return result;

    const data = await res.json() as Record<string, { usd: number; usd_24h_change: number }>;

    for (const { symbol, id } of ids) {
      const entry = data[id];
      if (entry?.usd) {
        result.set(symbol, {
          symbol,
          price: entry.usd,
          change: null,
          changePercent: entry.usd_24h_change ?? null,
          source: "coingecko",
        });
      }
    }
  } catch {
    // Silently fail — caller will handle missing data
  }
  return result;
}

// Fetch metal quotes from gold-api.com (free, no key)
async function fetchMetalQuotes(symbols: string[]): Promise<Map<string, FreeQuote>> {
  const result = new Map<string, FreeQuote>();

  const metals = symbols
    .map((s) => ({ symbol: s, code: METAL_MAP[s] }))
    .filter((s) => s.code);

  if (metals.length === 0) return result;

  const responses = await Promise.allSettled(
    metals.map(async (m) => {
      const res = await fetch(`https://api.gold-api.com/price/${m.code}`, {
        next: { revalidate: 30 },
      });
      if (!res.ok) throw new Error(`Failed for ${m.code}`);
      const data = (await res.json()) as { price: number };
      return { symbol: m.symbol, price: data.price };
    })
  );

  for (const r of responses) {
    if (r.status === "fulfilled") {
      result.set(r.value.symbol, {
        symbol: r.value.symbol,
        price: r.value.price,
        change: null,
        changePercent: null,
        source: "gold-api",
      });
    }
  }
  return result;
}

// Fetch forex quotes from open.er-api.com (free, no key, daily rates)
async function fetchForexQuotes(symbols: string[]): Promise<Map<string, FreeQuote>> {
  const result = new Map<string, FreeQuote>();

  // Group by base currency to minimize API calls
  const byBase = new Map<string, string[]>();
  for (const sym of symbols) {
    const pair = pairToCurrencies(sym);
    if (!pair) continue;
    if (!byBase.has(pair.from)) byBase.set(pair.from, []);
    byBase.get(pair.from)!.push(sym);
  }

  const responses = await Promise.allSettled(
    Array.from(byBase.entries()).map(async ([base, syms]) => {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
        next: { revalidate: 300 }, // 5 min cache (daily rates anyway)
      });
      if (!res.ok) throw new Error(`Failed for ${base}`);
      const data = (await res.json()) as { rates: Record<string, number> };
      return { base, syms, rates: data.rates };
    })
  );

  for (const r of responses) {
    if (r.status === "fulfilled") {
      for (const sym of r.value.syms) {
        const pair = pairToCurrencies(sym);
        if (!pair) continue;
        const rate = r.value.rates[pair.to];
        if (rate) {
          result.set(sym, {
            symbol: sym,
            price: rate,
            change: null,
            changePercent: null,
            source: "er-api",
          });
        }
      }
    }
  }
  return result;
}

// Fetch forex conversion rate (free, no key)
export async function freeConvert(from: string, to: string, amount: number): Promise<{
  from: string;
  to: string;
  rate: number;
  amount: number;
  converted: number;
  pair: string;
  source: string;
} | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rates: Record<string, number> };
    const rate = data.rates[to];
    if (!rate) return null;
    return {
      from,
      to,
      rate: parseFloat(rate.toFixed(6)),
      amount,
      converted: parseFloat((amount * rate).toFixed(2)),
      pair: `${from}/${to}`,
      source: "er-api",
    };
  } catch {
    return null;
  }
}

// Fetch historical forex rates (free, no key, from Frankfurter/ECB)
export async function freeHistoricalForex(
  symbols: string[],
  days: number
): Promise<Map<string, { date: string; price: number }[]>> {
  const result = new Map<string, { date: string; price: number }[]>();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Frankfurter supports historical time series
  for (const sym of symbols) {
    const pair = pairToCurrencies(sym);
    if (!pair) continue;
    try {
      const startDate = cutoff.toISOString().slice(0, 10);
      const endDate = new Date().toISOString().slice(0, 10);
      const res = await fetch(
        `https://api.frankfurter.app/${startDate}..${endDate}?from=${pair.from}&to=${pair.to}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { rates: Record<string, Record<string, number>> };
      const series: { date: string; price: number }[] = [];
      for (const [date, rates] of Object.entries(data.rates)) {
        const price = rates[pair.to];
        if (price) series.push({ date, price });
      }
      if (series.length > 0) result.set(sym, series);
    } catch {
      // Skip on error
    }
  }
  return result;
}

// Fetch historical crypto prices from CoinGecko (free, no key)
export async function freeHistoricalCrypto(
  symbols: string[],
  days: number
): Promise<Map<string, { date: string; price: number }[]>> {
  const result = new Map<string, { date: string; price: number }[]>();

  for (const sym of symbols) {
    const id = COINGECKO_MAP[sym];
    if (!id) continue;
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        { next: { revalidate: 300 } }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as { prices: [number, number][] };
      const series = data.prices.map(([ts, price]) => ({
        date: new Date(ts).toISOString().slice(0, 10),
        price,
      }));
      if (series.length > 0) result.set(sym, series);
    } catch {
      // Skip on error
    }
  }
  return result;
}

// Main entry point: fetch quotes for any asset type using free APIs
export async function fetchFreeQuotes(
  type: string,
  symbols: string[]
): Promise<Map<string, FreeQuote>> {
  switch (type) {
    case "crypto":
      return fetchCryptoQuotes(symbols);
    case "metals":
      return fetchMetalQuotes(symbols);
    case "forex":
      return fetchForexQuotes(symbols);
    case "bonds":
      // No free bond yield API — return empty (bonds require FMP)
      return new Map();
    default:
      return new Map();
  }
}
