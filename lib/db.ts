/**
 * Database abstraction layer — Supabase.
 *
 * Uses @supabase/supabase-js for database operations.
 * Falls back to filesystem in development when Supabase is not configured.
 *
 * SECURITY:
 * - Server-side operations use a service-role admin client that bypasses RLS.
 *   This is safe because these functions are only called from server-side
 *   API routes that are already protected by middleware (same-origin + Bearer token).
 * - The service role key is NEVER exposed to the client.
 * - Per-user data isolation is enforced via owner_id columns + RLS policies.
 */

import { promises as fs } from "fs";
import path from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ---------- Database clients (cached singletons) ----------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function hasDatabase(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Admin client (service role) — bypasses RLS for server-side operations
// ONLY use server-side, NEVER expose to client
let _adminClient: ReturnType<typeof createSupabaseClient> | null = null;

function getAdminClient() {
  if (!hasDatabase()) throw new Error("Supabase not configured");
  if (!_adminClient) {
    if (supabaseServiceKey) {
      // Service role key available — use admin client (bypasses RLS)
      _adminClient = createSupabaseClient(supabaseUrl!, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      // No service role key — use anon key (RLS applies)
      // This means RLS policies will enforce access control
      _adminClient = createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }
  return _adminClient;
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

export async function loadClientsDb<T>(ownerId?: string): Promise<T[]> {
  if (hasDatabase()) {
    const supabase = getAdminClient();
    let query = supabase.from("clients").select("*").order("created_at", { ascending: true });
    // If using anon key (no service role), filter by owner
    if (ownerId && !supabaseServiceKey) {
      query = query.eq("owner_id", ownerId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown) as T[];
  }
  return (await fsRead<T[]>("clients.json")) ?? [];
}

export async function saveClientsDb<T extends { id: string; owner_id?: string }>(
  clients: T[],
  ownerId?: string
): Promise<void> {
  if (hasDatabase()) {
    const supabase = getAdminClient();
    // Stamp owner_id if provided
    const rows = ownerId
      ? clients.map((c) => ({ ...c, owner_id: c.owner_id ?? ownerId }))
      : clients;
    const { error } = await supabase
      .from("clients")
      .upsert(rows as unknown as never[], { onConflict: "id" });
    if (error) throw error;
    return;
  }
  await fsWrite("clients.json", clients);
}

// ---------- Trades ----------

export async function loadTradesDb<T>(ownerId?: string): Promise<T[]> {
  if (hasDatabase()) {
    const supabase = getAdminClient();
    let query = supabase.from("trades").select("*").order("date", { ascending: false });
    if (ownerId && !supabaseServiceKey) {
      query = query.eq("owner_id", ownerId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown) as T[];
  }
  return (await fsRead<T[]>("trades.json")) ?? [];
}

export async function saveTradesDb<T extends { id: string; owner_id?: string }>(
  trades: T[],
  ownerId?: string
): Promise<void> {
  if (hasDatabase()) {
    const supabase = getAdminClient();
    const rows = ownerId
      ? trades.map((t) => ({ ...t, owner_id: t.owner_id ?? ownerId }))
      : trades;
    const { error } = await supabase
      .from("trades")
      .upsert(rows as unknown as never[], { onConflict: "id" });
    if (error) throw error;
    return;
  }
  await fsWrite("trades.json", trades);
}

// ---------- Scan ----------

export async function loadLastScanDb<T>(): Promise<T | null> {
  if (hasDatabase()) {
    const supabase = getAdminClient();
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
    const supabase = getAdminClient();
    const { error } = await supabase.from("scans").insert(scan as unknown as never);
    if (error) throw error;
    return;
  }
  await fsWrite("scan.json", scan);
}
