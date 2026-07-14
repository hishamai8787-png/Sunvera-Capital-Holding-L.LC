// Finnhub data fetchers (server-side only) — real-time quote and company news.
// Requires FINNHUB_API_KEY in .env.local — get a free key at finnhub.io

import type { NewsItem } from "./types";
import { DataSourceError } from "./fmp";

const BASE = "https://finnhub.io/api/v1";

function apiKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  return !key || key.startsWith("PASTE_") ? null : key;
}

async function finnhubGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new DataSourceError(
      "Finnhub API key is missing. Add FINNHUB_API_KEY=your_key to .env.local.",
      "finnhub"
    );
  }
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", key);

  const res = await fetch(url, { next: { revalidate: 300 } });
  if (res.status === 401 || res.status === 403) {
    throw new DataSourceError("Finnhub rejected the API key. Check FINNHUB_API_KEY.", "finnhub", res.status);
  }
  if (res.status === 429) {
    throw new DataSourceError("Finnhub rate limit reached (60 calls/min on free tier).", "finnhub", 429);
  }
  if (!res.ok) {
    throw new DataSourceError(`Finnhub request failed (${res.status}) for ${path}`, "finnhub", res.status);
  }
  return (await res.json()) as T;
}

/** Company news from the last `days` days. Returns [] if Finnhub key not configured. */
export async function getCompanyNews(symbol: string, days = 14): Promise<NewsItem[]> {
  if (!apiKey()) return []; // news is optional — analysis still works without it
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 3600 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  try {
    const items = await finnhubGet<NewsItem[]>("/company-news", {
      symbol,
      from: fmt(from),
      to: fmt(to),
    });
    return (items || []).slice(0, 12);
  } catch {
    return []; // never let news failures break the analysis
  }
}

export interface FinnhubQuote {
  c: number; // current
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
}

/** Real-time quote; returns null if key missing or request fails. */
export async function getRealtimeQuote(symbol: string): Promise<FinnhubQuote | null> {
  if (!apiKey()) return null;
  try {
    const q = await finnhubGet<FinnhubQuote>("/quote", { symbol });
    return q && q.c ? q : null;
  } catch {
    return null;
  }
}
