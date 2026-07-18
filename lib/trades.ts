// Server-only storage for trades.
// Uses Supabase when configured, falls back to filesystem in development.

import { loadTradesDb, saveTradesDb } from "./db";

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  dateClosed?: string | null;
  sector: string;
  assetClass: string;
  market: string;
  direction?: "Long" | "Short";
  notes?: string;
  thesis?: string;
  pnl?: number | null;
  pnlPct?: number | null;
  holdingDays?: number | null;
}

// Alias for backward compat — some code uses dateOpened

/** Column headers for the downloadable Excel trade-import template. */
export const TEMPLATE_HEADERS = [
  "date",
  "symbol",
  "side",
  "quantity",
  "price",
  "sector",
  "assetClass",
  "market",
  "notes",
];

export async function loadTrades(): Promise<Trade[]> {
  return loadTradesDb<Trade>();
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  await saveTradesDb(trades);
}

/**
 * Convert raw spreadsheet rows into validated Trade objects.
 * Returns { trades, warnings } so callers can report issues to the user.
 */
export function rowsToTrades(
  rows: Record<string, unknown>[]
): { trades: Trade[]; warnings: string[] } {
  const warnings: string[] = [];
  const trades: Trade[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const symbol = String(row.symbol ?? row.Symbol ?? row["Symbol "] ?? "").trim().toUpperCase();
    const side = String(row.side ?? row.Side ?? row["Side "] ?? "buy").trim().toLowerCase() as "buy" | "sell";
    const quantity = Number(row.quantity ?? row.Quantity ?? row["Quantity "] ?? row.qty ?? 0);
    const price = Number(row.price ?? row.Price ?? row["Price "] ?? 0);
    const date = String(row.date ?? row.Date ?? row["Date "] ?? new Date().toISOString().slice(0, 10)).trim();
    const sector = String(row.sector ?? row.Sector ?? row["Sector "] ?? "Unknown").trim();
    const assetClass = String(row.assetClass ?? row.AssetClass ?? row["Asset Class"] ?? row["AssetClass"] ?? "Equity").trim();
    const market = String(row.market ?? row.Market ?? row["Market "] ?? "US").trim();
    const notes = row.notes ? String(row.notes) : undefined;

    if (!symbol) {
      warnings.push(`Row ${i + 2}: missing symbol, skipped.`);
      continue;
    }
    if (!quantity || quantity <= 0) {
      warnings.push(`Row ${i + 2}: invalid quantity for ${symbol}, skipped.`);
      continue;
    }
    if (!price || price <= 0) {
      warnings.push(`Row ${i + 2}: invalid price for ${symbol}, skipped.`);
      continue;
    }

    trades.push({
      id: crypto.randomUUID(),
      symbol,
      side: side === "sell" ? "sell" : "buy",
      quantity,
      price,
      date,
      sector,
      assetClass,
      market,
      notes,
    });
  }

  return { trades, warnings };
}
