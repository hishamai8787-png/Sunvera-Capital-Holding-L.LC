// GET /api/convert?from=EUR&to=USD&amount=1000 — currency converter
import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";

export const revalidate = 60;

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

  const key = process.env.FMP_API_KEY;
  if (!key || key.startsWith("PASTE_")) {
    return NextResponse.json(
      { error: "API key not configured." },
      { status: 503 }
    );
  }

  try {
    // FMP forex pair symbol is e.g. "EURUSD"
    const pair = `${from}${to}`;
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${pair}&apikey=${key}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Unable to fetch exchange rate." },
        { status: 502 }
      );
    }

    const quotes = (await res.json()) as Array<{ symbol: string; price?: number }>;
    let rate = quotes[0]?.price;

    // If direct pair not found, try reverse (e.g. USDEUR -> 1/EURUSD)
    if (!rate && from !== to) {
      const reversePair = `${to}${from}`;
      const reverseRes = await fetch(
        `https://financialmodelingprep.com/stable/quote?symbol=${reversePair}&apikey=${key}`,
        { next: { revalidate: 60 } }
      );
      if (reverseRes.ok) {
        const reverseQuotes = (await reverseRes.json()) as Array<{ symbol: string; price?: number }>;
        if (reverseQuotes[0]?.price) {
          rate = 1 / reverseQuotes[0].price;
        }
      }
    }

    // If still no rate, try via USD cross
    if (!rate && from !== "USD" && to !== "USD") {
      const fromUsd = await fetchRate("USD" + from, key);
      const toUsd = await fetchRate("USD" + to, key);
      if (fromUsd && toUsd) {
        rate = toUsd / fromUsd;
      }
    }

    if (!rate) {
      if (from === to) rate = 1;
      else {
        return NextResponse.json(
          { error: `No exchange rate available for ${from}/${to}.` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        from,
        to,
        rate: parseFloat(rate.toFixed(6)),
        amount,
        converted: parseFloat((amount * rate).toFixed(2)),
        pair: `${from}/${to}`,
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  } catch (err) {
    console.error("[convert] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Conversion failed. Please try again." },
      { status: 500 }
    );
  }
}

async function fetchRate(pair: string, key: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/quote?symbol=${pair}&apikey=${key}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const quotes = (await res.json()) as Array<{ symbol: string; price?: number }>;
    return quotes[0]?.price ?? null;
  } catch {
    return null;
  }
}
