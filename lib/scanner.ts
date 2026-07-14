// Opportunity scanner — runs the full analysis engine across a universe,
// detects signals, and writes a "why investigate" brief for each flag.

import { promises as fs } from "fs";
import path from "path";
import { analyzeCompany } from "./analyze";

export const SCAN_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMZN", "TSLA",
  "JPM", "V", "MA", "BAC",
  "JNJ", "PFE", "MRK", "UNH",
  "KO", "PG", "PEP", "WMT", "MCD",
  "HD", "NKE", "DIS",
  "XOM", "CVX",
  "CAT", "BA", "GE",
  "CSCO", "INTC", "IBM", "ORCL",
];

export interface Opportunity {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  score: number;
  rating: string;
  opportunityScore: number;
  flagged: boolean;
  signals: string[];
  risks: string[];
  brief: string;
}

export interface ScanResult {
  generatedAt: string;
  scanned: number;
  unavailable: string[];
  opportunities: Opportunity[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const SCAN_FILE = path.join(DATA_DIR, "scan.json");

export async function loadLastScan(): Promise<ScanResult | null> {
  try {
    const raw = await fs.readFile(SCAN_FILE, "utf8");
    return JSON.parse(raw) as ScanResult;
  } catch {
    return null;
  }
}

const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

async function scanSymbol(symbol: string): Promise<Opportunity | null> {
  try {
    const r = await analyzeCompany(symbol);
    const metric = (cat: string, key: string): number | null => {
      const m = r.categories.find((c) => c.key === cat)?.metrics.find((x) => x.key === key);
      return m?.value ?? null;
    };

    const score = r.score.total;
    const mos = r.dcf.marginOfSafety;
    const fcfYield = metric("valuation", "fcfYield");
    const divYield = metric("dividends", "divYield2");
    const pe = metric("valuation", "pe");
    const piotroski = r.piotroski.score;
    const revGrowth = r.growth.find((g) => g.metric === "Revenue")?.cagr3 ?? null;
    const price = r.quote.price;
    const nearLow =
      r.quote.yearLow && r.quote.yearHigh && r.quote.yearHigh > r.quote.yearLow
        ? (price - r.quote.yearLow) / (r.quote.yearHigh - r.quote.yearLow)
        : null;

    const signals: string[] = [];
    const risks: string[] = [];

    if (score >= 75) signals.push(`elite quality — scores ${score}/100 on the framework`);
    else if (score >= 65) signals.push(`solid quality — scores ${score}/100`);
    if (mos !== null && mos >= 0.15) signals.push(`trades ${pct(mos)} below DCF fair value`);
    if (fcfYield !== null && fcfYield >= 0.05) signals.push(`${pct(fcfYield, 1)} free cash flow yield`);
    if (piotroski >= 7) signals.push(`Piotroski ${piotroski}/9 — fundamentals improving on a broad front`);
    if (nearLow !== null && nearLow <= 0.2 && score >= 60)
      signals.push(`quality name in the bottom ${pct(Math.max(nearLow, 0.01))} of its 52-week range`);
    if (revGrowth !== null && revGrowth >= 0.1) signals.push(`revenue compounding at ${pct(revGrowth)}/yr (3y)`);
    if (divYield !== null && divYield >= 0.03) signals.push(`${pct(divYield, 1)} dividend yield`);

    // Altman Z is calibrated for industrial companies — meaningless for banks/insurers
    const isFinancial = (r.profile.sector || "").toLowerCase().includes("financial");
    if (!isFinancial) {
      if (r.altman.zone === "distress") risks.push("Altman Z in the distress zone");
      else if (r.altman.zone === "grey") risks.push("Altman Z in the grey zone");
    }
    if (score < 55) risks.push(`weak framework score (${score}/100)`);
    if (pe !== null && pe > 35) risks.push(`rich valuation at ${pe.toFixed(0)}x earnings`);
    if (mos !== null && mos < -0.3) risks.push(`trades ${pct(-mos)} above modeled fair value`);
    const fcf = metric("cashflow", "fcf");
    if (fcf !== null && fcf <= 0) risks.push("negative free cash flow");
    if (piotroski <= 3) risks.push(`Piotroski ${piotroski}/9 — deteriorating trends`);

    const opportunityScore = Math.round(
      score * 0.5 +
        (mos !== null ? Math.max(Math.min(mos, 0.5), -0.3) * 40 : 0) +
        (fcfYield !== null ? Math.min(fcfYield, 0.1) * 150 : 0) +
        piotroski * 1.5 +
        (nearLow !== null && nearLow <= 0.2 && score >= 60 ? 6 : 0) +
        (revGrowth !== null ? Math.min(Math.max(revGrowth, 0), 0.25) * 30 : 0) -
        risks.length * 4
    );

    const flagged = signals.length >= 2 && opportunityScore >= 45;

    const brief =
      `${r.profile.companyName} (${symbol}) — ${r.score.rating}, ${score}/100. ` +
      (signals.length
        ? `Worth investigating: ${signals.slice(0, 3).join("; ")}.`
        : `No standout signals at the current price.`) +
      (risks.length ? ` Watch for: ${risks.slice(0, 2).join("; ")}.` : "");

    return {
      symbol,
      companyName: r.profile.companyName,
      sector: r.profile.sector,
      price,
      score,
      rating: r.score.rating,
      opportunityScore,
      flagged,
      signals,
      risks,
      brief,
    };
  } catch {
    return null;
  }
}

export async function runScan(extraSymbols: string[]): Promise<ScanResult> {
  const symbols = Array.from(
    new Set([...SCAN_UNIVERSE, ...extraSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean)])
  );

  const opportunities: Opportunity[] = [];
  const unavailable: string[] = [];
  const chunkSize = 3;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map((s) => scanSymbol(s)));
    chunk.forEach((s, j) => {
      const r = results[j];
      if (r) opportunities.push(r);
      else unavailable.push(s);
    });
  }

  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const result: ScanResult = {
    generatedAt: new Date().toISOString(),
    scanned: opportunities.length,
    unavailable,
    opportunities,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SCAN_FILE, JSON.stringify(result, null, 2), "utf8");
  return result;
}
