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
  sector: string;
  assetClass: string;
  market: string;
  notes?: string;
}

export async function loadTrades(): Promise<Trade[]> {
  return loadTradesDb<Trade>();
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  await saveTradesDb(trades);
}
