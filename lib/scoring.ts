// Composite scores — Framework Sections 13 (Altman Z), 14 (Piotroski F),
// 15 (DCF), 17-18 (100-point scoring model and rating bands).

import type {
  CompanyData,
  AltmanResult,
  PiotroskiResult,
  DcfResult,
  ScoreResult,
  ScoreBreakdown,
} from "./types";
import { cagr, type Derived } from "./ratios";

const safe = (n: number | null | undefined): number | null =>
  typeof n === "number" && isFinite(n) ? n : null;

// ---------- Altman Z-Score ----------

export function altmanZ(data: CompanyData, d: Derived): AltmanResult {
  const ta = d.totalAssets;
  const retained = safe(data.balance[0]?.retainedEarnings);
  if (!ta || ta <= 0) {
    return { z: null, zone: "na", components: [] };
  }
  const x1 = d.workingCapital !== null ? d.workingCapital / ta : null;
  const x2 = retained !== null ? retained / ta : null;
  const x3 = d.ebit !== null ? d.ebit / ta : null;
  const x4 =
    d.marketCap && d.totalLiabilities && d.totalLiabilities > 0
      ? d.marketCap / d.totalLiabilities
      : null;
  const x5 = d.revenue !== null ? d.revenue / ta : null;

  if ([x1, x2, x3, x4, x5].some((x) => x === null)) {
    return {
      z: null,
      zone: "na",
      components: [
        { label: "X1 Working Capital / Assets", value: x1 },
        { label: "X2 Retained Earnings / Assets", value: x2 },
        { label: "X3 EBIT / Assets", value: x3 },
        { label: "X4 Market Equity / Liabilities", value: x4 },
        { label: "X5 Revenue / Assets", value: x5 },
      ],
    };
  }

  const z = 1.2 * x1! + 1.4 * x2! + 3.3 * x3! + 0.6 * x4! + 1.0 * x5!;
  const zone = z > 2.99 ? "safe" : z >= 1.81 ? "grey" : "distress";
  return {
    z,
    zone,
    components: [
      { label: "X1 Working Capital / Assets", value: x1 },
      { label: "X2 Retained Earnings / Assets", value: x2 },
      { label: "X3 EBIT / Assets", value: x3 },
      { label: "X4 Market Equity / Liabilities", value: x4 },
      { label: "X5 Revenue / Assets", value: x5 },
    ],
  };
}

// ---------- Piotroski F-Score ----------

export function piotroskiF(data: CompanyData): PiotroskiResult {
  const inc = data.income;
  const bal = data.balance;
  const cf = data.cashflow;

  const ratio = (a: number | null | undefined, b: number | null | undefined): number | null => {
    const x = safe(a);
    const y = safe(b);
    return x !== null && y !== null && y !== 0 ? x / y : null;
  };

  const roaCurr = ratio(inc[0]?.netIncome, bal[0]?.totalAssets);
  const roaPrev = ratio(inc[1]?.netIncome, bal[1]?.totalAssets);
  const ocf = safe(cf[0]?.operatingCashFlow);
  const ni = safe(inc[0]?.netIncome);
  const levCurr = ratio(bal[0]?.totalDebt, bal[0]?.totalAssets);
  const levPrev = ratio(bal[1]?.totalDebt, bal[1]?.totalAssets);
  const crCurr = ratio(bal[0]?.totalCurrentAssets, bal[0]?.totalCurrentLiabilities);
  const crPrev = ratio(bal[1]?.totalCurrentAssets, bal[1]?.totalCurrentLiabilities);
  const shCurr = safe(inc[0]?.weightedAverageShsOutDil);
  const shPrev = safe(inc[1]?.weightedAverageShsOutDil);
  const gmCurr = ratio(inc[0]?.grossProfit, inc[0]?.revenue);
  const gmPrev = ratio(inc[1]?.grossProfit, inc[1]?.revenue);
  const atCurr = ratio(inc[0]?.revenue, bal[0]?.totalAssets);
  const atPrev = ratio(inc[1]?.revenue, bal[1]?.totalAssets);

  const test = (cond: boolean | null): boolean | null => cond;
  const tests: { label: string; pass: boolean | null }[] = [
    { label: "Positive ROA", pass: test(roaCurr !== null ? roaCurr > 0 : null) },
    { label: "Positive operating cash flow", pass: test(ocf !== null ? ocf > 0 : null) },
    { label: "Improving ROA", pass: test(roaCurr !== null && roaPrev !== null ? roaCurr > roaPrev : null) },
    { label: "OCF exceeds net income (accrual quality)", pass: test(ocf !== null && ni !== null ? ocf > ni : null) },
    { label: "Lower leverage than prior year", pass: test(levCurr !== null && levPrev !== null ? levCurr <= levPrev : null) },
    { label: "Higher current ratio than prior year", pass: test(crCurr !== null && crPrev !== null ? crCurr > crPrev : null) },
    { label: "No share dilution", pass: test(shCurr !== null && shPrev !== null ? shCurr <= shPrev : null) },
    { label: "Higher gross margin than prior year", pass: test(gmCurr !== null && gmPrev !== null ? gmCurr > gmPrev : null) },
    { label: "Higher asset turnover than prior year", pass: test(atCurr !== null && atPrev !== null ? atCurr > atPrev : null) },
  ];

  const score = tests.reduce((s, t) => s + (t.pass === true ? 1 : 0), 0);
  return { score, tests };
}

// ---------- DCF intrinsic value (Section 15) ----------

export function dcf(data: CompanyData, d: Derived): DcfResult {
  const years = 5;
  const discountRate = 0.1; // default WACC assumption
  const terminalGrowth = 0.025;

  // Base FCF: latest, sanity-checked against 3y average to normalize a spike year
  const fcfs: number[] = [];
  for (let i = 0; i < Math.min(3, data.cashflow.length); i++) {
    const f =
      safe(data.cashflow[i]?.freeCashFlow) ??
      (safe(data.cashflow[i]?.operatingCashFlow) !== null &&
      safe(data.cashflow[i]?.capitalExpenditure) !== null
        ? (data.cashflow[i].operatingCashFlow as number) +
          (data.cashflow[i].capitalExpenditure as number)
        : NaN);
    if (isFinite(f as number)) fcfs.push(f as number);
  }
  const latest = fcfs[0] ?? null;
  const avg3 = fcfs.length ? fcfs.reduce((a, b) => a + b, 0) / fcfs.length : null;
  const baseFcf = latest !== null && avg3 !== null ? Math.min(latest, avg3 * 1.2) : latest;

  // Growth: historical 5y FCF CAGR, clamped to a conservative 2%..15%
  const n = data.cashflow.length;
  const pastIdx = Math.min(5, n - 1);
  const past =
    pastIdx > 0
      ? safe(data.cashflow[pastIdx]?.freeCashFlow) ??
        (safe(data.cashflow[pastIdx]?.operatingCashFlow) !== null &&
        safe(data.cashflow[pastIdx]?.capitalExpenditure) !== null
          ? (data.cashflow[pastIdx].operatingCashFlow as number) +
            (data.cashflow[pastIdx].capitalExpenditure as number)
          : null)
      : null;
  const histCagr = cagr(latest, past, pastIdx);
  const growthRate = Math.min(Math.max(histCagr ?? 0.05, 0.02), 0.15);

  if (baseFcf === null || baseFcf <= 0 || !d.shares) {
    return {
      baseFcf,
      growthRate,
      discountRate,
      terminalGrowth,
      years,
      fairValuePerShare: null,
      currentPrice: d.price,
      marginOfSafety: null,
    };
  }

  let pv = 0;
  let f = baseFcf;
  for (let t = 1; t <= years; t++) {
    f *= 1 + growthRate;
    pv += f / Math.pow(1 + discountRate, t);
  }
  const terminal = (f * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
  pv += terminal / Math.pow(1 + discountRate, years);

  const equityValue = pv - (d.netDebt ?? 0);
  const fair = equityValue / d.shares;
  const mos = fair > 0 ? (fair - d.price) / fair : null;

  return {
    baseFcf,
    growthRate,
    discountRate,
    terminalGrowth,
    years,
    fairValuePerShare: fair,
    currentPrice: d.price,
    marginOfSafety: mos,
  };
}

// ---------- 100-point scoring model (Sections 17-18) ----------

interface ScoreInputs {
  data: CompanyData;
  d: Derived;
  altman: AltmanResult;
  piotroski: PiotroskiResult;
  dcfRes: DcfResult;
}

// score a value against [floor, target]: 0 below floor, 1 above target, linear between
const scale = (v: number | null, floor: number, target: number): number => {
  if (v === null) return 0.4; // unknown = slightly below neutral, don't zero out
  if (target > floor) {
    if (v <= floor) return 0;
    if (v >= target) return 1;
    return (v - floor) / (target - floor);
  } else {
    // lower is better
    if (v >= floor) return 0;
    if (v <= target) return 1;
    return (floor - v) / (floor - target);
  }
};

export function scoreCompany({ data, d, altman, piotroski, dcfRes }: ScoreInputs): ScoreResult {
  const inc = data.income;
  const div_ = (a: number | null, b: number | null) =>
    a !== null && b !== null && b !== 0 ? a / b : null;

  // Profitability (15)
  const roe = div_(d.netIncome, d.equity);
  const roic = div_(d.nopat, d.investedCapital);
  const netMargin = div_(d.netIncome, d.revenue);
  const grossMargin = div_(d.grossProfit, d.revenue);
  const profitability =
    15 *
    (0.3 * scale(roic, 0.05, 0.15) +
      0.3 * scale(roe, 0.05, 0.15) +
      0.2 * scale(netMargin, 0.02, 0.12) +
      0.2 * scale(grossMargin, 0.15, 0.4));

  // Financial strength (15)
  const de = div_(d.totalDebt, d.equity);
  const intCov = d.interestExpense && d.interestExpense > 0 ? div_(d.ebit, d.interestExpense) : 15; // no interest = strong
  const currentRatio = div_(d.currentAssets, d.currentLiabilities);
  const zScore = altman.z;
  const strength =
    15 *
    (0.3 * scale(de === null ? null : de, 2, 0.5) +
      0.3 * scale(typeof intCov === "number" ? intCov : null, 2, 8) +
      0.2 * scale(currentRatio, 0.8, 2) +
      0.2 * scale(zScore, 1.81, 2.99));

  // Cash flow (15)
  const fcfYield = div_(d.fcf, d.marketCap);
  const fcfMargin = div_(d.fcf, d.revenue);
  const fcfConv = div_(d.fcf, d.netIncome);
  const cashflowScore =
    15 *
    (0.3 * (d.fcf !== null && d.fcf > 0 ? 1 : 0) +
      0.25 * scale(fcfYield, 0.01, 0.06) +
      0.25 * scale(fcfMargin, 0.02, 0.12) +
      0.2 * scale(fcfConv, 0.5, 1));

  // Growth (20)
  const n = inc.length;
  const yrs = Math.min(5, n - 1);
  const revC = yrs > 0 ? cagr(safe(inc[0]?.revenue), safe(inc[yrs]?.revenue), yrs) : null;
  const epsC = yrs > 0 ? cagr(safe(inc[0]?.epsDiluted), safe(inc[yrs]?.epsDiluted), yrs) : null;
  const fcf0 = safe(data.cashflow[0]?.freeCashFlow);
  const fcfN = yrs > 0 ? safe(data.cashflow[Math.min(yrs, data.cashflow.length - 1)]?.freeCashFlow) : null;
  const fcfC = cagr(fcf0, fcfN, yrs);
  const growth =
    20 *
    (0.4 * scale(revC, 0, 0.1) + 0.35 * scale(epsC, 0, 0.12) + 0.25 * scale(fcfC, 0, 0.12));

  // Valuation (15)
  const pe = div_(d.price, d.eps);
  const evEbitda = div_(d.enterpriseValue, d.ebitda);
  const mos = dcfRes.marginOfSafety;
  const valuation =
    15 *
    (0.3 * scale(pe !== null && pe > 0 ? pe : null, 35, 12) +
      0.25 * scale(evEbitda !== null && evEbitda > 0 ? evEbitda : null, 20, 8) +
      0.25 * scale(fcfYield, 0.01, 0.07) +
      0.2 * scale(mos, -0.2, 0.25));

  // Dividend quality (5)
  const divYield = div_(d.dps, d.price);
  const payout = d.netIncome && d.dividendsPaid ? d.dividendsPaid / d.netIncome : null;
  const paysDividend = d.dividendsPaid !== null && d.dividendsPaid > 0;
  const dividend = paysDividend
    ? 5 * (0.4 * scale(divYield, 0.005, 0.03) + 0.6 * scale(payout, 1, 0.4))
    : 2.5; // non-payer: neutral, not penalized to zero

  // Management (5) — quantitative proxies: dilution discipline + buybacks
  const shCurr = safe(inc[0]?.weightedAverageShsOutDil);
  const shPrev3 = safe(inc[Math.min(3, n - 1)]?.weightedAverageShsOutDil);
  const dilution = shCurr !== null && shPrev3 !== null && shPrev3 > 0 ? shCurr / shPrev3 - 1 : null;
  const buybackYield = div_(d.buybacks, d.marketCap);
  const management =
    5 * (0.6 * scale(dilution, 0.06, -0.02) + 0.4 * scale(buybackYield, 0, 0.02));

  // Economic moat (10) — quantitative proxies until user scores qualitatively:
  // sustained ROIC, gross margin level, margin stability
  const gmNow = grossMargin;
  const gmPast = div_(safe(inc[Math.min(4, n - 1)]?.grossProfit), safe(inc[Math.min(4, n - 1)]?.revenue));
  const gmStable = gmNow !== null && gmPast !== null ? gmNow - gmPast : null;
  const moat =
    10 *
    (0.45 * scale(roic, 0.06, 0.18) +
      0.3 * scale(gmNow, 0.2, 0.45) +
      0.25 * scale(gmStable, -0.05, 0.02));

  const breakdown: ScoreBreakdown[] = [
    { category: "Profitability", weight: 15, earned: round1(profitability), detail: "ROIC, ROE, net & gross margins vs framework targets" },
    { category: "Financial Strength", weight: 15, earned: round1(strength), detail: "Debt/equity, interest coverage, current ratio, Altman Z" },
    { category: "Cash Flow", weight: 15, earned: round1(cashflowScore), detail: "Positive FCF, FCF yield, FCF margin, FCF conversion" },
    { category: "Growth", weight: 20, earned: round1(growth), detail: "Revenue / EPS / FCF CAGR (5y)" },
    { category: "Valuation", weight: 15, earned: round1(valuation), detail: "P/E, EV/EBITDA, FCF yield, DCF margin of safety" },
    { category: "Dividend Quality", weight: 5, earned: round1(dividend), detail: "Yield and payout sustainability" },
    { category: "Management", weight: 5, earned: round1(management), detail: "Share dilution discipline and buybacks (quantitative proxy)" },
    { category: "Economic Moat", weight: 10, earned: round1(moat), detail: "Sustained ROIC and margin durability (quantitative proxy)" },
  ];

  const total = Math.round(breakdown.reduce((s, b) => s + b.earned, 0));
  const rating =
    total >= 90 ? "Exceptional" : total >= 80 ? "Excellent" : total >= 70 ? "Good" : total >= 60 ? "Fair" : "Weak";

  return { total, rating, breakdown };
}

const round1 = (v: number) => Math.round(v * 10) / 10;
