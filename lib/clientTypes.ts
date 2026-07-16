// Client & mandate types + evaluation engine — safe to import from client
// components (no filesystem access; storage lives in clients.ts).

import type { AnalysisReport } from "./types";

export interface Position {
  symbol: string;
  quantity: number;
  costBasis: number; // per unit
  targetPct?: number | null; // target portfolio weight, e.g. 0.2 = 20%
}

/** Allocation drift beyond this (in percentage points) triggers a rebalance alert. */
export const DRIFT_ALERT_PP = 0.05;

export interface Mandate {
  minScore: number | null; // Sunvera 100-pt score
  maxPE: number | null;
  minDividendYield: number | null; // fraction, e.g. 0.03
  maxNetDebtEbitda: number | null;
  minInterestCoverage: number | null;
  minMarketCap: number | null; // absolute, e.g. 10e9
  sectors: string[]; // empty = all sectors allowed
}

export interface Client {
  id: string;
  name: string;
  notes: string;
  mandate: Mandate;
  positions: Position[];
}

export const EMPTY_MANDATE: Mandate = {
  minScore: null,
  maxPE: null,
  minDividendYield: null,
  maxNetDebtEbitda: null,
  minInterestCoverage: null,
  minMarketCap: null,
  sectors: [],
};

// ---------- mandate evaluation ----------

export interface MandateCheck {
  rule: string;
  pass: boolean | null; // null = rule not enforceable (missing data)
  actual: string;
  limit: string;
}

export interface SymbolEvaluation {
  symbol: string;
  companyName: string;
  sector: string;
  score: number;
  rating: string;
  price: number;
  checks: MandateCheck[];
  fits: boolean;
  failedRules: string[];
  error?: string;
}

const metricValue = (report: AnalysisReport, categoryKey: string, metricKey: string): number | null => {
  const cat = report.categories.find((c) => c.key === categoryKey);
  const m = cat?.metrics.find((x) => x.key === metricKey);
  return m?.value ?? null;
};

const fmtPct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);
const fmtX = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}x`);
const fmtB = (v: number | null) => (v === null ? "—" : `$${(v / 1e9).toFixed(1)}B`);

export function evaluateMandate(report: AnalysisReport, mandate: Mandate): SymbolEvaluation {
  const checks: MandateCheck[] = [];

  const push = (
    rule: string,
    enforced: boolean,
    pass: boolean | null,
    actual: string,
    limit: string
  ) => {
    if (enforced) checks.push({ rule, pass, actual, limit });
  };

  const score = report.score.total;
  push(
    "Minimum Sunvera score",
    mandate.minScore !== null,
    mandate.minScore === null ? null : score >= mandate.minScore,
    `${score}`,
    `≥ ${mandate.minScore}`
  );

  const pe = metricValue(report, "valuation", "pe");
  push(
    "Maximum P/E",
    mandate.maxPE !== null,
    mandate.maxPE === null ? null : pe === null || pe <= 0 ? false : pe <= mandate.maxPE,
    pe === null ? "—" : pe.toFixed(1),
    `≤ ${mandate.maxPE}`
  );

  const divYield = metricValue(report, "dividends", "divYield2");
  push(
    "Minimum dividend yield",
    mandate.minDividendYield !== null,
    mandate.minDividendYield === null ? null : (divYield ?? 0) >= mandate.minDividendYield,
    fmtPct(divYield ?? 0),
    `≥ ${fmtPct(mandate.minDividendYield)}`
  );

  // Net Debt/EBITDA is meaningless for banks/insurers — deposits and float are
  // not corporate leverage. Mark the rule as not-applicable for financials.
  const isFinancial = (report.profile.sector || "").toLowerCase().includes("financial");
  const ndEbitda = metricValue(report, "strength", "ndEbitda");
  push(
    "Maximum Net Debt/EBITDA",
    mandate.maxNetDebtEbitda !== null,
    mandate.maxNetDebtEbitda === null
      ? null
      : isFinancial
        ? true
        : ndEbitda === null
          ? true // no meaningful leverage data usually means net cash; treat missing as pass
          : ndEbitda <= mandate.maxNetDebtEbitda,
    isFinancial ? "n/a (financial)" : fmtX(ndEbitda),
    `≤ ${fmtX(mandate.maxNetDebtEbitda)}`
  );

  const intCov = metricValue(report, "strength", "intCov");
  push(
    "Minimum interest coverage",
    mandate.minInterestCoverage !== null,
    mandate.minInterestCoverage === null
      ? null
      : intCov === null
        ? true // negligible interest expense = effectively unlimited coverage
        : intCov >= mandate.minInterestCoverage,
    intCov === null ? "no material interest" : fmtX(intCov),
    `≥ ${fmtX(mandate.minInterestCoverage)}`
  );

  const mcap = report.quote.marketCap ?? report.profile.marketCap ?? null;
  push(
    "Minimum market cap",
    mandate.minMarketCap !== null,
    mandate.minMarketCap === null ? null : mcap !== null && mcap >= mandate.minMarketCap,
    fmtB(mcap),
    `≥ ${fmtB(mandate.minMarketCap)}`
  );

  const sector = report.profile.sector || "Unknown";
  push(
    "Sector",
    mandate.sectors.length > 0,
    mandate.sectors.length === 0
      ? null
      : mandate.sectors.map((s) => s.toLowerCase()).includes(sector.toLowerCase()),
    sector,
    mandate.sectors.join(", ")
  );

  const failedRules = checks.filter((c) => c.pass === false).map((c) => c.rule);
  return {
    symbol: report.symbol,
    companyName: report.profile.companyName,
    sector,
    score,
    rating: report.score.rating,
    price: report.quote.price,
    checks,
    fits: failedRules.length === 0,
    failedRules,
  };
}

/** Default screening universe — large caps the free FMP plan can serve. */
export const DEFAULT_UNIVERSE = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "META",
  "NVDA",
  "JNJ",
  "KO",
  "PG",
  "JPM",
  "XOM",
  "WMT",
  "V",
];
