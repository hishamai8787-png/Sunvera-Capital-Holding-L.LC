// Bundled demo dataset so the playbook module works before any import.

import type { Trade } from "./trades";

const t = (
  partial: Omit<Trade, "id" | "holdingDays" | "pnl"> & { pnl?: number | null }
): Trade => {
  const holdingDays =
    partial.dateClosed !== null
      ? Math.round(
          (new Date(partial.dateClosed).getTime() - new Date(partial.dateOpened).getTime()) /
            86400000
        )
      : null;
  const pnl =
    partial.pnl ??
    (partial.exit !== null
      ? (partial.exit - partial.entry) * partial.quantity * (partial.direction === "Short" ? -1 : 1)
      : null);
  return {
    ...partial,
    pnl,
    holdingDays,
    id: `${partial.symbol}-${partial.dateOpened}`,
  };
};

export const SAMPLE_TRADES: Trade[] = [
  t({ dateOpened: "2023-01-12", dateClosed: "2023-08-04", assetClass: "Equity", symbol: "MSFT", name: "Microsoft", sector: "Technology", market: "US", direction: "Long", entry: 232, exit: 322, quantity: 100, pnlPct: 0.388, thesis: "Cloud + AI capex cycle", notes: "" }),
  t({ dateOpened: "2023-03-02", dateClosed: "2023-05-19", assetClass: "Equity", symbol: "NVDA", name: "NVIDIA", sector: "Technology", market: "US", direction: "Long", entry: 23.2, exit: 38.9, quantity: 800, pnlPct: 0.677, thesis: "Datacenter GPU demand", notes: "" }),
  t({ dateOpened: "2024-02-15", dateClosed: "2024-04-30", assetClass: "Equity", symbol: "INTC", name: "Intel", sector: "Technology", market: "US", direction: "Long", entry: 43.5, exit: 30.8, quantity: 300, pnlPct: -0.292, thesis: "Foundry turnaround", notes: "Thesis broke on foundry losses; exited late" }),
  t({ dateOpened: "2023-06-01", dateClosed: "2024-06-01", assetClass: "Equity", symbol: "KO", name: "Coca-Cola", sector: "Consumer Staples", market: "US", direction: "Long", entry: 60.1, exit: 63.4, quantity: 500, pnlPct: 0.055, thesis: "Defensive yield + pricing power", notes: "" }),
  t({ dateOpened: "2023-09-11", dateClosed: "2024-01-22", assetClass: "Equity", symbol: "PG", name: "Procter & Gamble", sector: "Consumer Staples", market: "US", direction: "Long", entry: 145, exit: 158, quantity: 200, pnlPct: 0.09, thesis: "Margin recovery post-inflation", notes: "" }),
  t({ dateOpened: "2024-05-08", dateClosed: "2024-11-15", assetClass: "Equity", symbol: "NKE", name: "NIKE", sector: "Consumer Cyclical", market: "US", direction: "Long", entry: 92, exit: 76, quantity: 250, pnlPct: -0.174, thesis: "Brand recovery", notes: "Caught a falling knife; averaged down against the trend" }),
  t({ dateOpened: "2023-11-20", dateClosed: "2024-03-08", assetClass: "Equity", symbol: "JPM", name: "JPMorgan", sector: "Financials", market: "US", direction: "Long", entry: 153, exit: 192, quantity: 150, pnlPct: 0.255, thesis: "Rate tailwind + fortress balance sheet", notes: "" }),
  t({ dateOpened: "2024-01-10", dateClosed: "2024-08-02", assetClass: "Equity", symbol: "HSBC", name: "HSBC", sector: "Financials", market: "EM", direction: "Long", entry: 38.2, exit: 44.6, quantity: 400, pnlPct: 0.168, thesis: "Asia rebound + buybacks", notes: "" }),
  t({ dateOpened: "2024-03-18", dateClosed: "2024-05-02", assetClass: "Equity", symbol: "BABA", name: "Alibaba", sector: "Consumer Cyclical", market: "EM", direction: "Long", entry: 72, exit: 68, quantity: 300, pnlPct: -0.056, thesis: "China stimulus play", notes: "Macro thesis, no company-level edge" }),
  t({ dateOpened: "2023-02-06", dateClosed: "2023-04-14", assetClass: "Bond", symbol: "QATAR29", name: "Qatar Sovereign 2029", sector: "Sovereign", market: "GCC", direction: "Long", entry: 96.2, exit: 99.1, quantity: 200000, pnl: 5800, pnlPct: 0.03, thesis: "Spread compression on energy strength", notes: "" }),
  t({ dateOpened: "2023-05-22", dateClosed: "2023-12-01", assetClass: "Bond", symbol: "ARAMCO27", name: "Saudi Aramco 2027", sector: "Energy Credit", market: "GCC", direction: "Long", entry: 94.8, exit: 97.6, quantity: 200000, pnl: 5600, pnlPct: 0.0295, thesis: "IG carry + oil floor", notes: "" }),
  t({ dateOpened: "2024-02-01", dateClosed: "2024-09-13", assetClass: "Bond", symbol: "EGYPT31", name: "Egypt Sovereign 2031", sector: "Sovereign", market: "EM", direction: "Long", entry: 71, exit: 82.5, quantity: 150000, pnl: 17250, pnlPct: 0.162, thesis: "IMF deal + Gulf backstop", notes: "High-beta EM worked with a catalyst" }),
  t({ dateOpened: "2024-06-10", dateClosed: "2024-08-05", assetClass: "Bond", symbol: "TURKEY28", name: "Turkey Sovereign 2028", sector: "Sovereign", market: "EM", direction: "Long", entry: 89, exit: 87.2, quantity: 150000, pnl: -2700, pnlPct: -0.02, thesis: "Orthodox policy pivot", notes: "Entered after the rally; late to the trade" }),
  t({ dateOpened: "2023-07-03", dateClosed: "2023-09-29", assetClass: "FX", symbol: "USDJPY", name: "USD/JPY", sector: "FX Majors", market: "Global", direction: "Long", entry: 144.5, exit: 149.3, quantity: 100000, pnl: 3300, pnlPct: 0.0332, thesis: "Rate differential carry", notes: "" }),
  t({ dateOpened: "2024-04-15", dateClosed: "2024-05-03", assetClass: "FX", symbol: "EURUSD", name: "EUR/USD", sector: "FX Majors", market: "Global", direction: "Short", entry: 1.078, exit: 1.072, quantity: 200000, pnl: 1200, pnlPct: 0.0056, thesis: "ECB cuts before Fed", notes: "" }),
  t({ dateOpened: "2024-07-22", dateClosed: "2024-08-06", assetClass: "FX", symbol: "USDJPY", name: "USD/JPY", sector: "FX Majors", market: "Global", direction: "Long", entry: 155.8, exit: 146.2, quantity: 100000, pnl: -6200, pnlPct: -0.0616, thesis: "Carry continuation", notes: "BoJ surprise + carry unwind; no stop in place" }),
  t({ dateOpened: "2025-01-15", dateClosed: "2025-06-20", assetClass: "Equity", symbol: "META", name: "Meta Platforms", sector: "Technology", market: "US", direction: "Long", entry: 612, exit: 700, quantity: 50, pnlPct: 0.144, thesis: "Ad reacceleration + AI efficiency", notes: "" }),
  t({ dateOpened: "2025-03-05", dateClosed: "2025-04-22", assetClass: "Equity", symbol: "GOOGL", name: "Alphabet", sector: "Technology", market: "US", direction: "Long", entry: 165, exit: 158, quantity: 200, pnlPct: -0.042, thesis: "Search resilience", notes: "Stopped out on AI-disruption fears; re-entry missed" }),
  t({ dateOpened: "2025-05-12", dateClosed: "2025-11-28", assetClass: "Bond", symbol: "PHILIP30", name: "Philippines Sovereign 2030", sector: "Sovereign", market: "EM", direction: "Long", entry: 93.5, exit: 96.8, quantity: 200000, pnl: 6600, pnlPct: 0.0353, thesis: "BSP easing cycle + ratings momentum", notes: "" }),
  t({ dateOpened: "2025-09-02", dateClosed: null, assetClass: "Equity", symbol: "AAPL", name: "Apple", sector: "Technology", market: "US", direction: "Long", entry: 245, exit: null, quantity: 100, pnlPct: null, thesis: "Services mix shift", notes: "" }),
  t({ dateOpened: "2026-02-10", dateClosed: null, assetClass: "Bond", symbol: "QATAR33", name: "Qatar Sovereign 2033", sector: "Sovereign", market: "GCC", direction: "Long", entry: 97.1, exit: null, quantity: 200000, pnlPct: null, thesis: "LNG expansion cash flows", notes: "" }),
];
