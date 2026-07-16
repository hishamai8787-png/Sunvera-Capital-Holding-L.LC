/**
 * Database abstraction layer — Supabase.
 *
 * Replaces filesystem storage (clients.ts, trades.ts, scanner.ts)
 * with Supabase PostgreSQL. Falls back to filesystem in development
 * when DATABASE_URL is not set.
 */

import { promises as fs } from "fs";
import path from "path";

// ---------- Types ----------

export interface ClientRecord {
  id: string;
  name: string;
  notes: string;
  mandate: Record<string, unknown>;
  positions: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  sector: string;
  asset_class: string;
  market: string;
  notes: string;
  created_at: string;
}

export interface ScanRecord {
  id: string;
  generated_at: string;
  scanned: number;
  opportunities: Record<string, unknown>[];
  unavailable: string[];
  created_at: string;
}

// ---------- Database client ----------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export function hasDatabase(): boolean {
  return !!(SUPABASE_URL && SUPABASE_KEY);
}

async function supabaseFetch(table: string, options: RequestInit = {}) {
  if (!hasDatabase()) throw new Error("Supabase not configured");
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY!}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res;
}

// ---------- Filesystem fallback (development only) ----------

const DATA_DIR = path.join(process.cwd(), "data");

async function fsRead<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function fsWrite(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), "utf8");
}

// ---------- Clients ----------

export async function loadClientsDb<T>(): Promise<T[]> {
  if (hasDatabase()) {
    const res = await supabaseFetch("clients?order=created_at.asc");
    return (await res.json()) as T[];
  }
  return (await fsRead<T[]>("clients.json")) ?? [];
}

export async function saveClientsDb<T extends { id: string }>(clients: T[]): Promise<void> {
  if (hasDatabase()) {
    // Upsert all clients
    await supabaseFetch("clients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(clients),
    });
    return;
  }
  await fsWrite("clients.json", clients);
}

// ---------- Trades ----------

export async function loadTradesDb<T>(): Promise<T[]> {
  if (hasDatabase()) {
    const res = await supabaseFetch("trades?order=date.desc");
    return (await res.json()) as T[];
  }
  return (await fsRead<T[]>("trades.json")) ?? [];
}

export async function saveTradesDb<T>(trades: T[]): Promise<void> {
  if (hasDatabase()) {
    await supabaseFetch("trades", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(trades),
    });
    return;
  }
  await fsWrite("trades.json", trades);
}

// ---------- Scan ----------

export async function loadLastScanDb<T>(): Promise<T | null> {
  if (hasDatabase()) {
    const res = await supabaseFetch("scans?order=created_at.desc&limit=1");
    const rows = await res.json();
    return rows[0] ?? null;
  }
  return fsRead<T>("scan.json");
}

export async function saveScanDb<T>(scan: T): Promise<void> {
  if (hasDatabase()) {
    await supabaseFetch("scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scan),
    });
    return;
  }
  await fsWrite("scan.json", scan);
}
