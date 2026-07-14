// Financial Modeling Prep data fetchers (server-side only).
// Requires FMP_API_KEY in .env.local — get a free key at financialmodelingprep.com

import type {
  CompanyProfile,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  Quote,
} from "./types";

// FMP "stable" API — accounts created after Aug 2025 cannot use the legacy /api/v3 endpoints.
const BASE = "https://financialmodelingprep.com/stable";

export class DataSourceError extends Error {
  constructor(
    message: string,
    public readonly source: "fmp" | "finnhub",
    public readonly status?: number
  ) {
    super(message);
  }
}

function apiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key || key.startsWith("PASTE_")) {
    throw new DataSourceError(
      "Financial Modeling Prep API key is missing. Add FMP_API_KEY=your_key to .env.local and restart the app.",
      "fmp"
    );
  }
  return key;
}

async function fmpGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", apiKey());

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (res.status === 401 || res.status === 403) {
    throw new DataSourceError(
      "Financial Modeling Prep rejected the API key. Check FMP_API_KEY in .env.local.",
      "fmp",
      res.status
    );
  }
  if (res.status === 429) {
    throw new DataSourceError(
      "Financial Modeling Prep rate limit reached (free tier is 250 calls/day). Try again later.",
      "fmp",
      429
    );
  }
  if (!res.ok) {
    throw new DataSourceError(`FMP request failed (${res.status}) for ${path}`, "fmp", res.status);
  }
  const json = (await res.json()) as T & { "Error Message"?: string };
  if (json && typeof json === "object" && "Error Message" in (json as object)) {
    throw new DataSourceError(String((json as Record<string, unknown>)["Error Message"]), "fmp");
  }
  return json;
}

export async function getProfile(symbol: string): Promise<CompanyProfile> {
  const arr = await fmpGet<CompanyProfile[]>(`/profile`, { symbol });
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new DataSourceError(
      `No company found for ticker "${symbol}". Check the symbol (free FMP plans cover US-listed stocks).`,
      "fmp",
      404
    );
  }
  return arr[0];
}

export async function getQuote(symbol: string): Promise<Quote> {
  const arr = await fmpGet<Quote[]>(`/quote`, { symbol });
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new DataSourceError(`No quote available for "${symbol}".`, "fmp", 404);
  }
  return arr[0];
}

export async function getIncomeStatements(symbol: string, limit = 5): Promise<IncomeStatement[]> {
  return fmpGet<IncomeStatement[]>(`/income-statement`, {
    symbol,
    period: "annual",
    limit: String(limit),
  });
}

export async function getBalanceSheets(symbol: string, limit = 5): Promise<BalanceSheet[]> {
  return fmpGet<BalanceSheet[]>(`/balance-sheet-statement`, {
    symbol,
    period: "annual",
    limit: String(limit),
  });
}

export async function getCashFlows(symbol: string, limit = 5): Promise<CashFlowStatement[]> {
  return fmpGet<CashFlowStatement[]>(`/cash-flow-statement`, {
    symbol,
    period: "annual",
    limit: String(limit),
  });
}

export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

export async function searchTicker(query: string): Promise<SearchResult[]> {
  return fmpGet<SearchResult[]>(`/search-symbol`, { query, limit: "8" });
}

export interface HistoricalPrice {
  date: string;
  price: number;
}

/** Daily EOD prices, most-recent-first (~5 years on the free plan). */
export async function getHistoricalPrices(symbol: string): Promise<HistoricalPrice[]> {
  return fmpGet<HistoricalPrice[]>(`/historical-price-eod/light`, {
    symbol,
  });
}

export interface PeerInfo {
  symbol: string;
  companyName: string;
  price: number;
  mktCap: number;
}

export async function fmpGetPeers(symbol: string): Promise<PeerInfo[]> {
  return fmpGet<PeerInfo[]>(`/stock-peers`, { symbol });
}
