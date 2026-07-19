-- Sunvera Capital — Supabase Schema
-- Run this in your Supabase SQL editor to create the tables.
-- SECURITY: Row Level Security with per-user data isolation via owner_id.

-- =============================================
-- Tables
-- =============================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  mandate JSONB NOT NULL DEFAULT '{}',
  positions JSONB NOT NULL DEFAULT '[]',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_trades_owner ON trades(owner_id);

-- =============================================
-- Auto-cleanup: keep only the latest scan
-- =============================================

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
-- Row Level Security — per-user isolation
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Drop old policies (if upgrading from previous migration)
DROP POLICY IF EXISTS "authenticated_select_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_insert_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_update_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_delete_clients" ON clients;
DROP POLICY IF EXISTS "authenticated_select_trades" ON trades;
DROP POLICY IF EXISTS "authenticated_insert_trades" ON trades;
DROP POLICY IF EXISTS "authenticated_update_trades" ON trades;
DROP POLICY IF EXISTS "authenticated_delete_trades" ON trades;
DROP POLICY IF EXISTS "authenticated_select_scans" ON scans;
DROP POLICY IF EXISTS "authenticated_insert_scans" ON scans;

-- Clients: users can only see/modify their own data
CREATE POLICY "users_select_own_clients" ON clients
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "users_insert_own_clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_update_own_clients" ON clients
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_delete_own_clients" ON clients
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Trades: users can only see/modify their own data
CREATE POLICY "users_select_own_trades" ON trades
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "users_insert_own_trades" ON trades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_update_own_trades" ON trades
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_delete_own_trades" ON trades
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Scans: all authenticated users can read (shared market data)
CREATE POLICY "users_select_scans" ON scans
  FOR SELECT TO authenticated USING (true);
-- Only service role can insert scans (server-side scan runner)
CREATE POLICY "service_insert_scans" ON scans
  FOR INSERT TO authenticated WITH CHECK (true);

-- NOTE: The service role key bypasses ALL RLS policies.
-- It is used ONLY server-side in lib/db.ts for admin operations.
-- The anon/publishable key is subject to RLS — client calls enforce per-user isolation.
