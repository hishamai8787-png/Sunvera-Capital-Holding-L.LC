// Trade history data layer — model, disk storage, and spreadsheet parsing.
// Trades live in <app>/data/trades.json on the user's machine.

import { promises as fs } from "fs";
import path from "path";

export interface Trade {
  id: string;
  dateOpened: string; // ISO yyyy-mm-dd
  dateClosed: string | null; // null = still open
  assetClass: string; // Equity | Bond | FX | Fund | Commodity | Other
  symbol: string;
  name: string;
  sector: string;
  market: string; // e.g. US, EM, GCC, EU, PH
  direction: "Long" | "Short";
  entry: number;
  exit: number | null;
  quantity: number;
  pnl: number | null; // absolute, in account currency
  pnlPct: number | null; // e.g. 0.12 = +12%
  holdingDays: number | null;
  thesis: string;
  notes: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

export async function loadTrades(): Promise<Trade[]> {
  try {
    const raw = await fs.readFile(TRADES_FILE, "utf8");
    const parsed = JSON.parse(raw) as Trade[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TRADES_FILE, JSON.stringify(trades, null, 2), "utf8");
}

// ---------- spreadsheet row → Trade ----------

/** Header aliases: template header plus common variants, all lowercased. */
const COLS: Record<string, string[]> = {
  dateOpened: ["date opened", "open date", "entry date", "date", "buy date"],
  dateClosed: ["date closed", "close date", "exit date", "sell date"],
  assetClass: ["asset class", "asset", "type", "instrument"],
  symbol: ["symbol", "ticker", "code"],
  name: ["name", "company", "instrument name", "security"],
  sector: ["sector", "industry"],
  market: ["market", "region", "country"],
  direction: ["direction", "side", "long/short"],
  entry: ["entry", "entry price", "buy price", "open price", "cost"],
  exit: ["exit", "exit price", "sell price", "close price"],
  quantity: ["quantity", "qty", "shares", "units", "size", "nominal"],
  pnl: ["pnl", "p&l", "profit", "profit/loss", "pl", "gain"],
  pnlPct: ["pnl %", "p&l %", "return", "return %", "pnl%", "%"],
  thesis: ["thesis", "rationale", "reason", "strategy"],
  notes: ["notes", "comment", "comments", "outcome notes"],
};

function excelDateToIso(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    // Excel serial date
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/[,%$\s]/g, ""));
  return isFinite(n) ? n : null;
}

export interface ImportResult {
  trades: Trade[];
  skipped: number;
  warnings: string[];
}

/** rows: array of objects keyed by header (e.g. from xlsx sheet_to_json). */
export function rowsToTrades(rows: Record<string, unknown>[]): ImportResult {
  const warnings: string[] = [];
  let skipped = 0;

  // build header lookup from the first row's keys
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const lookup = new Map<string, string>(); // field -> actual header
  for (const [field, aliases] of Object.entries(COLS)) {
    const hit = keys.find((k) => aliases.includes(k.trim().toLowerCase()));
    if (hit) lookup.set(field, hit);
  }
  const get = (row: Record<string, unknown>, field: string): unknown => {
    const h = lookup.get(field);
    return h ? row[h] : undefined;
  };

  if (!lookup.has("symbol") && !lookup.has("name")) {
    return {
      trades: [],
      skipped: rows.length,
      warnings: [
        `Couldn't find a "Symbol" or "Name" column. Found headers: ${keys.join(", ")}. Use the template or rename your columns.`,
      ],
    };
  }

  const trades: Trade[] = [];
  rows.forEach((row, i) => {
    const symbol = String(get(row, "symbol") ?? "").trim().toUpperCase();
    const name = String(get(row, "name") ?? "").trim();
    const dateOpened = excelDateToIso(get(row, "dateOpened"));
    const entry = toNum(get(row, "entry"));
    if ((!symbol && !name) || !dateOpened) {
      skipped++;
      return;
    }

    const dateClosed = excelDateToIso(get(row, "dateClosed"));
    const exit = toNum(get(row, "exit"));
    const quantity = toNum(get(row, "quantity")) ?? 1;
    const dirRaw = String(get(row, "direction") ?? "Long").trim().toLowerCase();
    const direction: Trade["direction"] = dirRaw.startsWith("s") ? "Short" : "Long";

    let pnl = toNum(get(row, "pnl"));
    let pnlPct = toNum(get(row, "pnlPct"));
    // percent may come as 12 (meaning 12%) or 0.12 — normalize to fraction
    if (pnlPct !== null && Math.abs(pnlPct) > 1.5) pnlPct = pnlPct / 100;

    if (pnl === null && entry !== null && exit !== null) {
      const raw = (exit - entry) * quantity;
      pnl = direction === "Short" ? -raw : raw;
    }
    if (pnlPct === null && entry !== null && exit !== null && entry !== 0) {
      const raw = (exit - entry) / Math.abs(entry);
      pnlPct = direction === "Short" ? -raw : raw;
    }

    const holdingDays =
      dateOpened && dateClosed
        ? Math.max(
            0,
            Math.round(
              (new Date(dateClosed).getTime() - new Date(dateOpened).getTime()) / 86400000
            )
          )
        : null;

    trades.push({
      id: `t${i}-${symbol || name}-${dateOpened}`,
      dateOpened,
      dateClosed,
      assetClass: String(get(row, "assetClass") ?? "Equity").trim() || "Equity",
      symbol: symbol || name.slice(0, 12).toUpperCase(),
      name: name || symbol,
      sector: String(get(row, "sector") ?? "Unclassified").trim() || "Unclassified",
      market: String(get(row, "market") ?? "US").trim() || "US",
      direction,
      entry: entry ?? 0,
      exit,
      quantity,
      pnl,
      pnlPct,
      holdingDays,
      thesis: String(get(row, "thesis") ?? "").trim(),
      notes: String(get(row, "notes") ?? "").trim(),
    });
  });

  if (skipped > 0)
    warnings.push(`${skipped} row(s) skipped (missing symbol/name or open date).`);

  return { trades, skipped, warnings };
}

export const TEMPLATE_HEADERS = [
  "Date Opened",
  "Date Closed",
  "Asset Class",
  "Symbol",
  "Name",
  "Sector",
  "Market",
  "Direction",
  "Entry Price",
  "Exit Price",
  "Quantity",
  "PnL",
  "PnL %",
  "Thesis",
  "Notes",
];
