// GET /api/convert?from=EUR&to=USD&amount=1000 — currency converter
// Primary: FMP. Fallback: open.er-api.com (free, no key).
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";
import { freeConvert } from "@/lib/freeDataSources";

export const revalidate = 30;

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "convert");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const from = sanitizeString(searchParams.get("from") ?? "USD", 10).toUpperCase();
  const to = sanitizeString(searchParams.get("to") ?? "EUR", 10).toUpperCase();
  const amount = parseFloat(searchParams.get("amount") ?? "1");

  if (!from || !to || from.length !== 3 || to.length !== 3) {
    return NextResponse.json(
      { error: "Provide 3-letter currency codes for both 'from' and 'to'." },
      { status: 400 }
    );
  }
  if (isNaN(amount) || amount < 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number." },
      { status: 400 }
    );
  }

  if (from === to) {
    return NextResponse.json({
      from, to, rate: 1, amount, converted: amount, pair: `${from}/${to}`, source: "identity",
    });
  }

  const key = process.env.FMP_API_KEY;

  // Try FMP first
  if (key && !key.startsWith("PASTE_")) {
    try {
      const pair = `${from}${to}`;
      const res = await fetch(
        `https://financialmodelingprep.com/stable/quote?symbol=${pair}&apikey=${key}`,
        { next: { revalidate: 30 } }
      );

      if (res.ok) {
        const quotes = (await res.json()) as Array<{ symbol: string; price?: number }>;
        let rate = quotes[0]?.price;

        if (!rate) {
          // Try reverse pair
          const reversePair = `${to}${from}`;
          const reverseRes = await fetch(
            `https://financialmodelingprep.com/stable/quote?symbol=${reversePair}&apikey=${key}`,
            { next: { revalidate: 30 } }
          );
          if (reverseRes.ok) {
            const reverseQuotes = (await reverseRes.json()) as Array<{ symbol: string; price?: number }>;
            if (reverseQuotes[0]?.price) {
              rate = 1 / reverseQuotes[0].price;
            }
          }
        }

        // Try USD cross
        if (!rate && from !== "USD" && to !== "USD") {
          const fromUsd = await fetchFmpRate("USD" + from, key);
          const toUsd = await fetchFmpRate("USD" + to, key);
          if (fromUsd && toUsd) rate = toUsd / fromUsd;
        }

        if (rate) {
          return NextResponse.json({
            from, to, rate: parseFloat(rate.toFixed(6)), amount,
            converted: parseFloat((amount * rate).toFixed(2)),
            pair: `${from}/${to}`, source: "fmp",
          }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
        }
      }
    } catch {
      // Fall through to free API
    }
  }

  // Fallback: free API (no key required)
  const freeResult = await freeConvert(from, to, amount);
  if (freeResult) {
    return NextResponse.json(freeResult, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  return NextResponse.json(
    { error: `No exchange rate available for ${from}/${to}.` },
    { status: 404 }
  );
}

async function fetchFmpRate(pair: string, key: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${pair}&apikey=${key}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const quotes = (await res.json()) as Array<{ symbol: string; price?: number }>;
    return quotes[0]?.price ?? null;
  } catch {
    return null;
  }
}
