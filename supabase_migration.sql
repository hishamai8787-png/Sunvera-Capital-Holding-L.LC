-- Sunvera Capital — Supabase Schema
-- Run this in your Supabase SQL editor to create the tables.

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

-- Enable Row Level Security (to be configured with auth)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- NOTE: Add policies once you have auth set up. For now, service role bypasses RLS.
