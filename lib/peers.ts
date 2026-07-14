// Peer / industry comparison — pulls statements for peer tickers and
// compares the borrower against them on key credit & profitability metrics.

import { getIncomeStatements, getBalanceSheets, getCashFlows, fmpGetPeers } from "./fmp";

export interface PeerRow {
  symbol: string;
  companyName?: string;
  revenue: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  roe: number | null;
  netDebtEbitda: number | null;
  interestCoverage: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  fcfMargin: number | null;
  revenueGrowth3y: number | null;
  failed?: boolean;
}

export interface PeerComparison {
  subject: PeerRow;
  peers: PeerRow[];
  median: Omit<PeerRow, "symbol" | "companyName" | "failed">;
}

const safe = (n: number | null | undefined): number | null =>
  typeof n === "number" && isFinite(n) ? n : null;
const div = (a: number | null | undefined, b: number | null | undefined): number | null => {
  const x = safe(a);
  const y = safe(b);
  return x !== null && y !== null && y !== 0 ? x / y : null;
};

async function buildRow(symbol: string): Promise<PeerRow> {
  try {
    const [incomeRaw, balanceRaw, cashflowRaw] = await Promise.all([
      getIncomeStatements(symbol, 5),
      getBalanceSheets(symbol, 5),
      getCashFlows(symbol, 5),
    ]);
    const income = incomeRaw.filter((s) => s.revenue || s.netIncome);
    const balance = balanceRaw.filter((s) => s.totalAssets);
    const cashflow = cashflowRaw.filter(
      (s) => s.operatingCashFlow || s.freeCashFlow || s.capitalExpenditure
    );
    const inc = income[0];
    const bal = balance.find((b) => b.fiscalYear === inc?.fiscalYear) ?? balance[0];
    const cf = cashflow.find((c) => c.fiscalYear === inc?.fiscalYear) ?? cashflow[0];
    if (!inc || !bal) return emptyRow(symbol, true);

    const netDebt =
      safe(bal.netDebt) ??
      (safe(bal.totalDebt) !== null && safe(bal.cashAndCashEquivalents) !== null
        ? bal.totalDebt - bal.cashAndCashEquivalents
        : null);
    const fcf =
      safe(cf?.freeCashFlow) ??
      (safe(cf?.operatingCashFlow) !== null && safe(cf?.capitalExpenditure) !== null
        ? cf.operatingCashFlow + cf.capitalExpenditure
        : null);
    const interest = safe(inc.interestExpense);
    const n = income.length;
    const yrs = Math.min(3, n - 1);
    const past = yrs > 0 ? safe(income[yrs]?.revenue) : null;
    const latest = safe(inc.revenue);
    const growth3y =
      latest !== null && past !== null && past > 0 && latest > 0 && yrs > 0
        ? Math.pow(latest / past, 1 / yrs) - 1
        : null;

    return {
      symbol,
      revenue: latest,
      ebitdaMargin: div(inc.ebitda, inc.revenue),
      netMargin: div(inc.netIncome, inc.revenue),
      roe: div(inc.netIncome, bal.totalStockholdersEquity),
      netDebtEbitda: div(netDebt, inc.ebitda),
      interestCoverage: interest && interest > 0 ? div(inc.operatingIncome, interest) : null,
      debtToEquity: div(bal.totalDebt, bal.totalStockholdersEquity),
      currentRatio: div(bal.totalCurrentAssets, bal.totalCurrentLiabilities),
      fcfMargin: div(fcf, inc.revenue),
      revenueGrowth3y: growth3y,
    };
  } catch {
    return emptyRow(symbol, true);
  }
}

const emptyRow = (symbol: string, failed = false): PeerRow => ({
  symbol,
  revenue: null,
  ebitdaMargin: null,
  netMargin: null,
  roe: null,
  netDebtEbitda: null,
  interestCoverage: null,
  debtToEquity: null,
  currentRatio: null,
  fcfMargin: null,
  revenueGrowth3y: null,
  failed,
});

function median(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Compare subject vs peers. If peerSymbols is empty, auto-discovers peers
 * from FMP (top 3 by market cap). Each peer costs ~3 API calls.
 */
export async function comparePeers(
  subjectSymbol: string,
  peerSymbols: string[]
): Promise<PeerComparison> {
  let symbols = peerSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
  const names = new Map<string, string>();
  const autoDiscovered = !symbols.length;

  if (autoDiscovered) {
    try {
      // Try more candidates than needed — the free FMP plan only serves
      // statements for major large-caps, so some discovered peers will 402.
      const discovered = await fmpGetPeers(subjectSymbol);
      for (const p of discovered) names.set(p.symbol, p.companyName);
      symbols = discovered.slice(0, 6).map((p) => p.symbol);
    } catch {
      symbols = [];
    }
  }
  symbols = symbols.filter((s) => s !== subjectSymbol.toUpperCase()).slice(0, 6);

  const [subject, ...allPeers] = await Promise.all([
    buildRow(subjectSymbol.toUpperCase()),
    ...symbols.map((s) => buildRow(s)),
  ]);
  for (const p of allPeers) {
    const n = names.get(p.symbol);
    if (n) p.companyName = n;
  }

  // Auto-discovery: silently keep the first 3 that worked (plus note failures).
  // Explicit peers: keep everything the user asked for so failures are visible.
  const peers = autoDiscovered
    ? [...allPeers.filter((p) => !p.failed).slice(0, 3), ...allPeers.filter((p) => p.failed)]
    : allPeers.slice(0, 4);

  const ok = peers.filter((p) => !p.failed);
  return {
    subject,
    peers,
    median: {
      revenue: median(ok.map((p) => p.revenue)),
      ebitdaMargin: median(ok.map((p) => p.ebitdaMargin)),
      netMargin: median(ok.map((p) => p.netMargin)),
      roe: median(ok.map((p) => p.roe)),
      netDebtEbitda: median(ok.map((p) => p.netDebtEbitda)),
      interestCoverage: median(ok.map((p) => p.interestCoverage)),
      debtToEquity: median(ok.map((p) => p.debtToEquity)),
      currentRatio: median(ok.map((p) => p.currentRatio)),
      fcfMargin: median(ok.map((p) => p.fcfMargin)),
      revenueGrowth3y: median(ok.map((p) => p.revenueGrowth3y)),
    },
  };
}
