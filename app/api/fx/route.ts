// GET /api/fx — USD conversion rates for the supported display currencies.

import { NextResponse } from "next/server";

// pair symbol on FMP → how to derive USD→currency rate from its price
const PAIRS: { symbol: string; currency: string; invert: boolean }[] = [
  { symbol: "EURUSD", currency: "EUR", invert: true }, // price = USD per EUR
  { symbol: "GBPUSD", currency: "GBP", invert: true },
  { symbol: "USDJPY", currency: "JPY", invert: false }, // price = JPY per USD
  { symbol: "USDCHF", currency: "CHF", invert: false },
  { symbol: "USDCAD", currency: "CAD", invert: false },
  { symbol: "USDPHP", currency: "PHP", invert: false }, // paid tier — skipped if unavailable
];

// Long-standing hard USD pegs — used when the live pair isn't on the data plan
const PEGGED: Record<string, number> = {
  QAR: 3.64,
  SAR: 3.75,
  AED: 3.6725,
};

export async function GET() {
  const key = process.env.FMP_API_KEY;
  const rates: Record<string, number> = { USD: 1 };

  if (key && !key.startsWith("PASTE_")) {
    await Promise.all(
      PAIRS.map(async (p) => {
        try {
          const res = await fetch(
            `https://financialmodelingprep.com/stable/quote?symbol=${p.symbol}&apikey=${key}`,
            { next: { revalidate: 900 } } // refresh every 15 min
          );
          if (!res.ok) return;
          const arr = (await res.json()) as { price?: number }[];
          const price = arr?.[0]?.price;
          if (price && price > 0) rates[p.currency] = p.invert ? 1 / price : price;
        } catch {
          // skip pairs that fail — UI falls back to USD
        }
      })
    );
  }

  for (const [ccy, rate] of Object.entries(PEGGED)) {
    if (!(ccy in rates)) rates[ccy] = rate;
  }

  return NextResponse.json({ base: "USD", rates, asOf: new Date().toISOString() });
}
