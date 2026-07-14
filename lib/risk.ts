// Portfolio risk engine — volatility, correlation, and the marginal impact of
// adding a candidate position, computed from ~2 years of daily prices.

import { getHistoricalPrices } from "./fmp";
import type { Position } from "./clientTypes";

const TRADING_DAYS = 252;
const LOOKBACK_DAYS = 504; // ~2 years of common history

export interface AssetRisk {
  symbol: string;
  weight: number; // fraction of portfolio market value
  annualVol: number; // e.g. 0.24 = 24%
  avgCorrelation: number | null; // mean correlation with the other holdings
}

export interface CandidateImpact {
  symbol: string;
  weight: number; // assumed weight of the new position
  annualVol: number;
  avgCorrelationToPortfolio: number | null;
  portfolioVolBefore: number;
  portfolioVolAfter: number;
  diversifies: boolean;
}

export interface RiskReport {
  asOf: string;
  observations: number;
  portfolioVol: number | null;
  assets: AssetRisk[];
  matrix: { symbols: string[]; rows: number[][] }; // correlation matrix
  candidate: CandidateImpact | null;
  unavailable: string[];
}

/* ---------- math ---------- */

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function covariance(a: number[], b: number[]): number {
  const ma = mean(a);
  const mb = mean(b);
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb);
  return s / (a.length - 1);
}

const stdev = (xs: number[]) => Math.sqrt(covariance(xs, xs));

/* ---------- data assembly ---------- */

async function getReturns(symbol: string): Promise<Map<string, number> | null> {
  try {
    const prices = await getHistoricalPrices(symbol);
    if (!prices || prices.length < 60) return null;
    // most-recent-first → ascending
    const asc = [...prices].reverse();
    const returns = new Map<string, number>();
    for (let i = 1; i < asc.length; i++) {
      const prev = asc[i - 1].price;
      const curr = asc[i].price;
      if (prev > 0 && curr > 0) returns.set(asc[i].date, Math.log(curr / prev));
    }
    return returns;
  } catch {
    return null;
  }
}

/**
 * Compute the risk report for a set of positions (weighted by market value)
 * and optionally a candidate symbol assumed to enter at `candidateWeight`.
 */
export async function buildRiskReport(
  positions: Position[],
  marketValues: Record<string, number>, // symbol -> position market value
  candidateSymbol: string | null,
  candidateWeight: number // fraction, e.g. 0.05
): Promise<RiskReport> {
  const holdingSymbols = Array.from(new Set(positions.map((p) => p.symbol.toUpperCase())));
  const allSymbols = candidateSymbol
    ? Array.from(new Set([...holdingSymbols, candidateSymbol.toUpperCase()]))
    : holdingSymbols;

  // fetch return series (chunked to be rate-limit friendly)
  const series = new Map<string, Map<string, number>>();
  const unavailable: string[] = [];
  const chunkSize = 3;
  for (let i = 0; i < allSymbols.length; i += chunkSize) {
    const chunk = allSymbols.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map((s) => getReturns(s)));
    chunk.forEach((s, j) => {
      const r = results[j];
      if (r) series.set(s, r);
      else unavailable.push(s);
    });
  }

  const usableHoldings = holdingSymbols.filter((s) => series.has(s));
  if (usableHoldings.length === 0) {
    return {
      asOf: new Date().toISOString(),
      observations: 0,
      portfolioVol: null,
      assets: [],
      matrix: { symbols: [], rows: [] },
      candidate: null,
      unavailable,
    };
  }

  // common dates across all usable series (holdings + candidate)
  const usableAll = allSymbols.filter((s) => series.has(s));
  let common: string[] | null = null;
  for (const s of usableAll) {
    const dates = Array.from(series.get(s)!.keys());
    common = common ? common.filter((d) => series.get(s)!.has(d)) : dates;
  }
  const dates = (common ?? []).sort().slice(-LOOKBACK_DAYS);
  const observations = dates.length;

  const returnsFor = (s: string): number[] => dates.map((d) => series.get(s)!.get(d)!);

  // per-asset stats
  const rets = new Map<string, number[]>();
  for (const s of usableAll) rets.set(s, returnsFor(s));

  const vol = (s: string) => stdev(rets.get(s)!) * Math.sqrt(TRADING_DAYS);
  const corr = (a: string, b: string) => {
    const ra = rets.get(a)!;
    const rb = rets.get(b)!;
    const sa = stdev(ra);
    const sb = stdev(rb);
    return sa > 0 && sb > 0 ? covariance(ra, rb) / (sa * sb) : 0;
  };

  // weights from market values
  const totalValue = usableHoldings.reduce((sum, s) => sum + (marketValues[s] ?? 0), 0);
  const weights = new Map<string, number>();
  for (const s of usableHoldings) {
    weights.set(s, totalValue > 0 ? (marketValues[s] ?? 0) / totalValue : 1 / usableHoldings.length);
  }

  // portfolio vol: sqrt(w' Σ w), Σ annualized
  const portVol = (syms: string[], w: Map<string, number>): number => {
    let v = 0;
    for (const a of syms) {
      for (const b of syms) {
        v +=
          (w.get(a) ?? 0) *
          (w.get(b) ?? 0) *
          covariance(rets.get(a)!, rets.get(b)!) *
          TRADING_DAYS;
      }
    }
    return Math.sqrt(Math.max(0, v));
  };

  const portfolioVol = observations >= 60 ? portVol(usableHoldings, weights) : null;

  const assets: AssetRisk[] = usableHoldings.map((s) => {
    const others = usableHoldings.filter((x) => x !== s);
    return {
      symbol: s,
      weight: weights.get(s) ?? 0,
      annualVol: vol(s),
      avgCorrelation: others.length ? mean(others.map((o) => corr(s, o))) : null,
    };
  });

  // correlation matrix (holdings + candidate)
  const matrixSymbols = usableAll;
  const rows = matrixSymbols.map((a) => matrixSymbols.map((b) => corr(a, b)));

  // candidate impact
  let candidate: CandidateImpact | null = null;
  const cs = candidateSymbol?.toUpperCase() ?? null;
  if (cs && series.has(cs) && portfolioVol !== null) {
    const cw = Math.min(Math.max(candidateWeight, 0.01), 0.5);
    const newWeights = new Map<string, number>();
    for (const s of usableHoldings) newWeights.set(s, (weights.get(s) ?? 0) * (1 - cw));
    newWeights.set(cs, (newWeights.get(cs) ?? 0) + cw);
    const newSyms = Array.from(new Set([...usableHoldings, cs]));
    const after = portVol(newSyms, newWeights);
    const corrs = usableHoldings.filter((s) => s !== cs).map((s) => corr(cs, s));
    candidate = {
      symbol: cs,
      weight: cw,
      annualVol: vol(cs),
      avgCorrelationToPortfolio: corrs.length ? mean(corrs) : null,
      portfolioVolBefore: portfolioVol,
      portfolioVolAfter: after,
      diversifies: after < portfolioVol,
    };
  }

  return {
    asOf: new Date().toISOString(),
    observations,
    portfolioVol,
    assets,
    matrix: { symbols: matrixSymbols, rows },
    candidate,
    unavailable,
  };
}
