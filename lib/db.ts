/**
 * Database abstraction layer — Supabase.
 *
 * Uses @supabase/supabase-js for database operations.
 * Falls back to filesystem in development when Supabase is not configured.
 */

import { promises as fs } from "fs";
import path from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ---------- Database client ----------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasDatabase(): boolean {
  return !!(supabaseUrl && supabaseKey);
}

function getSupabase() {
  if (!hasDatabase()) throw new Error("Supabase not configured");
  return createSupabaseClient(supabaseUrl!, supabaseKey!);
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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data as unknown) as T[];
  }
  return (await fsRead<T[]>("clients.json")) ?? [];
}

export async function saveClientsDb<T extends { id: string }>(clients: T[]): Promise<void> {
  if (hasDatabase()) {
    const supabase = getSupabase();
    // Upsert all clients
    const { error } = await supabase
      .from("clients")
      .upsert(clients as unknown as Record<string, unknown>[], { onConflict: "id" });
    if (error) throw error;
    return;
  }
  await fsWrite("clients.json", clients);
}

// ---------- Trades ----------

export async function loadTradesDb<T>(): Promise<T[]> {
  if (hasDatabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;
    return (data as unknown) as T[];
  }
  return (await fsRead<T[]>("trades.json")) ?? [];
}

export async function saveTradesDb<T>(trades: T[]): Promise<void> {
  if (hasDatabase()) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("trades")
      .upsert(trades as unknown as Record<string, unknown>[], { onConflict: "id" });
    if (error) throw error;
    return;
  }
  await fsWrite("trades.json", trades);
}

// ---------- Scan ----------

export async function loadLastScanDb<T>(): Promise<T | null> {
  if (hasDatabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown) as T ?? null;
  }
  return fsRead<T>("scan.json");
}

export async function saveScanDb<T extends { generatedAt: string }>(scan: T): Promise<void> {
  if (hasDatabase()) {
    const supabase = getSupabase();
    const { error } = await supabase.from("scans").insert(scan as unknown as Record<string, unknown>);
    if (error) throw error;
    return;
  }
  await fsWrite("scan.json", scan);
}
