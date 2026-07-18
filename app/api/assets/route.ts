// GET /api/assets?type=forex|crypto|metals|bonds — multi-asset live quotes
// Primary: FMP (requires API key). Fallback: free APIs (CoinGecko, gold-api, er-api).
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { fetchFreeQuotes } from "@/lib/freeDataSources";

export const revalidate = 30; // 30s — live feel

interface AssetDef {
  symbol: string;
  label: string;
  category: string;
  subCategory?: string;
}

const ASSET_MAP: Record<string, AssetDef[]> = {
  forex: [
    { symbol: "EURUSD", label: "EUR/USD", category: "Major" },
    { symbol: "GBPUSD", label: "GBP/USD", category: "Major" },
    { symbol: "USDJPY", label: "USD/JPY", category: "Major" },
    { symbol: "USDCHF", label: "USD/CHF", category: "Major" },
    { symbol: "AUDUSD", label: "AUD/USD", category: "Major" },
    { symbol: "USDCAD", label: "USD/CAD", category: "Major" },
    { symbol: "NZDUSD", label: "NZD/USD", category: "Major" },
    { symbol: "USDSEK", label: "USD/SEK", category: "Minor" },
    { symbol: "USDNOK", label: "USD/NOK", category: "Minor" },
    { symbol: "USDSGD", label: "USD/SGD", category: "Minor" },
    { symbol: "USDCNH", label: "USD/CNH", category: "Minor" },
    { symbol: "USDMXN", label: "USD/MXN", category: "Emerging" },
    { symbol: "USDZAR", label: "USD/ZAR", category: "Emerging" },
    { symbol: "USDTRY", label: "USD/TRY", category: "Emerging" },
    { symbol: "USDSAR", label: "USD/SAR", category: "Gulf" },
    { symbol: "USDAED", label: "USD/AED", category: "Gulf" },
    { symbol: "USDQAR", label: "USD/QAR", category: "Gulf" },
  ],
  crypto: [
    { symbol: "BTCUSD", label: "Bitcoin", category: "Major", subCategory: "BTC" },
    { symbol: "ETHUSD", label: "Ethereum", category: "Major", subCategory: "ETH" },
    { symbol: "BNBUSD", label: "BNB", category: "Major" },
    { symbol: "XRPUSD", label: "XRP", category: "Major" },
    { symbol: "SOLUSD", label: "Solana", category: "Major" },
    { symbol: "ADAUSD", label: "Cardano", category: "Major" },
    { symbol: "DOGEUSD", label: "Dogecoin", category: "Altcoin" },
    { symbol: "AVAXUSD", label: "Avalanche", category: "Altcoin" },
    { symbol: "DOTUSD", label: "Polkadot", category: "Altcoin" },
    { symbol: "MATICUSD", label: "Polygon", category: "Altcoin" },
    { symbol: "LINKUSD", label: "Chainlink", category: "Altcoin" },
    { symbol: "LTCUSD", label: "Litecoin", category: "Altcoin" },
  ],
  metals: [
    { symbol: "XAUUSD", label: "Gold", category: "Precious" },
    { symbol: "XAGUSD", label: "Silver", category: "Precious" },
    { symbol: "XPTUSD", label: "Platinum", category: "Precious" },
    { symbol: "XPDUSD", label: "Palladium", category: "Precious" },
    { symbol: "XCUUSD", label: "Copper", category: "Industrial" },
    { symbol: "ALUUSD", label: "Aluminum", category: "Industrial" },
    { symbol: "ZNCUSD", label: "Zinc", category: "Industrial" },
    { symbol: "NICKEL", label: "Nickel", category: "Industrial" },
    { symbol: "LEADUSD", label: "Lead", category: "Industrial" },
    { symbol: "TINUSD", label: "Tin", category: "Industrial" },
    { symbol: "CLUSD", label: "WTI Crude Oil", category: "Energy" },
    { symbol: "BZUSD", label: "Brent Crude", category: "Energy" },
    { symbol: "NGUSD", label: "Natural Gas", category: "Energy" },
  ],
  bonds: [
    { symbol: "US2Y", label: "US 2-Year", category: "US Treasury" },
    { symbol: "US5Y", label: "US 5-Year", category: "US Treasury" },
    { symbol: "US10Y", label: "US 10-Year", category: "US Treasury" },
    { symbol: "US30Y", label: "US 30-Year", category: "US Treasury" },
    { symbol: "DE10Y", label: "Germany 10-Year", category: "Sovereign" },
    { symbol: "GB10Y", label: "UK 10-Year", category: "Sovereign" },
    { symbol: "JP10Y", label: "Japan 10-Year", category: "Sovereign" },
    { symbol: "FR10Y", label: "France 10-Year", category: "Sovereign" },
    { symbol: "IT10Y", label: "Italy 10-Year", category: "Sovereign" },
    { symbol: "ES10Y", label: "Spain 10-Year", category: "Sovereign" },
    { symbol: "CA5Y", label: "Canada 5-Year", category: "Sovereign" },
    { symbol: "AU10Y", label: "Australia 10-Year", category: "Sovereign" },
  ],
};

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "assets");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";

  const assets = ASSET_MAP[type];
  if (!assets) {
    return NextResponse.json(
      { error: "Invalid type. Use: forex, crypto, metals, or bonds." },
      { status: 400 }
    );
  }

  const key = process.env.FMP_API_KEY;
  const symbols = assets.map((a) => a.symbol);

  // Try FMP first (premium data)
  if (key && !key.startsWith("PASTE_")) {
    try {
      const symList = symbols.join(",");
      const res = await fetch(
        `https://financialmodelingprep.com/stable/quote?symbol=${symList}&apikey=${key}`,
        { next: { revalidate: 30 } }
      );

      if (res.ok) {
        const quotes = (await res.json()) as Array<{
          symbol: string;
          price?: number;
          change?: number;
          changePercentage?: number;
          yearHigh?: number;
          yearLow?: number;
        }>;

        const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
        const hasData = quotes.length > 0 && quotes.some((q) => q.price != null);

        if (hasData) {
          const result = assets.map((a) => {
            const q = quoteMap.get(a.symbol);
            return {
              ...a,
              price: q?.price ?? null,
              change: q?.change ?? null,
              changePercent: q?.changePercentage ?? null,
              yearHigh: q?.yearHigh ?? null,
              yearLow: q?.yearLow ?? null,
            };
          });
          return NextResponse.json(
            { assets: result, source: "fmp" },
            { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
          );
        }
      }
    } catch {
      // Fall through to free APIs
    }
  }

  // Fallback: free APIs (no key required)
  const freeQuotes = await fetchFreeQuotes(type, symbols);

  if (freeQuotes.size > 0) {
    const result = assets.map((a) => {
      const q = freeQuotes.get(a.symbol);
      return {
        ...a,
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        yearHigh: null,
        yearLow: null,
      };
    });
    return NextResponse.json(
      { assets: result, source: freeQuotes.values().next().value?.source ?? "free" },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  }

  // No data available at all
  return NextResponse.json(
    { assets: assets.map((a) => ({ ...a, price: null, change: null, changePercent: null })), source: "none" },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
  );
}
