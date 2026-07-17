-- Sunvera Capital — Supabase Schema
-- Run this in your Supabase SQL editor to create the tables.
-- SECURITY: Row Level Security is enabled WITH policies — authenticated users only.

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  mandate JSONB NOT NULL DEFAULT '{}',
  positions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  asset_class TEXT NOT NULL DEFAULT '',
  market TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scans table (only keeps the latest — old scans are auto-deleted)
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TEXT NOT NULL,
  scanned INTEGER NOT NULL DEFAULT 0,
  opportunities JSONB NOT NULL DEFAULT '[]',
  unavailable JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);

-- Auto-cleanup: keep only the latest scan (trigger)
CREATE OR REPLACE FUNCTION cleanup_old_scans()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM scans WHERE id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_scans ON scans;
CREATE TRIGGER trg_cleanup_scans
  AFTER INSERT ON scans
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_scans();

-- =============================================
-- Row Level Security — authenticated users only
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Clients: authenticated users can read, insert, update, delete
CREATE POLICY "authenticated_select_clients" ON clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_clients" ON clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_clients" ON clients
  FOR DELETE TO authenticated USING (true);

-- Trades: authenticated users can read, insert, update, delete
CREATE POLICY "authenticated_select_trades" ON trades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_trades" ON trades
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_trades" ON trades
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete_trades" ON trades
  FOR DELETE TO authenticated USING (true);

-- Scans: authenticated users can read and insert
CREATE POLICY "authenticated_select_scans" ON scans
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert_scans" ON scans
  FOR INSERT TO authenticated WITH CHECK (true);

-- NOTE: The service role key bypasses ALL RLS policies.
-- NEVER use the service role key in client-side code or as
-- a fallback for the publishable (anon) key.
-- The application uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY only.
