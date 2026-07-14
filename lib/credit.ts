// Credit analysis engine — banker's view of the same company data.
// Computes debt service capacity, leverage/coverage/liquidity metrics,
// facility pro-forma impact, and an internal 1-10 obligor risk rating.

import type { CompanyData } from "./types";
import type { Derived } from "./ratios";
import type { AltmanResult } from "./types";

export interface FacilityInput {
  amount: number; // in the company's reporting currency
  tenorYears: number;
  rate: number; // annual interest rate, e.g. 0.065
  type: string; // "Term Loan" | "Revolving Credit" | ...
  purpose: string;
  security: string; // collateral description or "Unsecured"
}

export interface CreditMetric {
  key: string;
  label: string;
  value: number | null;
  display: string;
  benchmark: string;
  assessment: "strong" | "acceptable" | "watch" | "weak" | "na";
}

export interface ProForma {
  netDebtEbitda: { before: number | null; after: number | null };
  interestCoverage: { before: number | null; after: number | null };
  debtToEquity: { before: number | null; after: number | null };
  annualDebtService: number; // interest + straight-line principal
  dscrProForma: number | null; // OCF vs total debt service incl. new facility
}

export interface RiskRating {
  grade: number; // 1 (minimal risk) .. 10 (loss)
  label: string;
  factors: { factor: string; score: number; weight: number; comment: string }[];
}

export interface CreditAssessment {
  metrics: CreditMetric[];
  trend: {
    year: string;
    revenue: number | null;
    ebitda: number | null;
    netDebtEbitda: number | null;
    interestCoverage: number | null;
    ocf: number | null;
    fcf: number | null;
  }[];
  proForma: ProForma | null;
  rating: RiskRating;
}

const safe = (n: number | null | undefined): number | null =>
  typeof n === "number" && isFinite(n) ? n : null;
const div = (a: number | null | undefined, b: number | null | undefined): number | null => {
  const x = safe(a);
  const y = safe(b);
  return x !== null && y !== null && y !== 0 ? x / y : null;
};

const fmtX = (v: number | null, d = 1) => (v === null ? "—" : `${v.toFixed(d)}x`);
const fmtPct = (v: number | null, d = 1) => (v === null ? "—" : `${(v * 100).toFixed(d)}%`);

type Assess = CreditMetric["assessment"];
const gradeHigher = (v: number | null, strong: number, acceptable: number, watch: number): Assess =>
  v === null ? "na" : v >= strong ? "strong" : v >= acceptable ? "acceptable" : v >= watch ? "watch" : "weak";
const gradeLower = (v: number | null, strong: number, acceptable: number, watch: number): Assess =>
  v === null ? "na" : v <= strong ? "strong" : v <= acceptable ? "acceptable" : v <= watch ? "watch" : "weak";

export function buildCreditAssessment(
  data: CompanyData,
  d: Derived,
  altman: AltmanResult,
  facility: FacilityInput | null
): CreditAssessment {
  const bal = data.balance[0];
  const cf = data.cashflow[0];

  const interestPaid = safe(cf?.interestPaid) ?? d.interestExpense;
  const shortTermDebt = safe(bal?.shortTermDebt) ?? 0;

  // Existing debt service ≈ interest paid + short-term (current) debt
  const debtService = (interestPaid ?? 0) + shortTermDebt;
  const dscr = debtService > 0 ? div(d.ocf, debtService) : null;

  const ndEbitda = div(d.netDebt, d.ebitda);
  const intCov = interestPaid && interestPaid > 0 ? div(d.ebit, interestPaid) : null;
  const ebitdaIntCov = interestPaid && interestPaid > 0 ? div(d.ebitda, interestPaid) : null;
  const de = div(d.totalDebt, d.equity);
  const debtFcf = d.fcf && d.fcf > 0 ? div(d.totalDebt, d.fcf) : null;
  const currentRatio = div(d.currentAssets, d.currentLiabilities);
  const quickRatio = div(
    (d.cash ?? 0) +
      (safe(bal?.shortTermInvestments) ?? 0) +
      (safe(bal?.netReceivables) ?? 0),
    d.currentLiabilities
  );
  const fcfMargin = div(d.fcf, d.revenue);
  const ocfDebt = div(d.ocf, d.totalDebt);

  const metrics: CreditMetric[] = [
    {
      key: "dscr",
      label: "Debt Service Coverage (OCF / debt service)",
      value: dscr,
      display: fmtX(dscr),
      benchmark: "≥ 1.25x acceptable, ≥ 2.0x strong",
      assessment: gradeHigher(dscr, 2, 1.25, 1),
    },
    {
      key: "ndEbitda",
      label: "Net Debt / EBITDA",
      value: ndEbitda,
      display: fmtX(ndEbitda),
      benchmark: "≤ 2.0x strong, ≤ 3.5x acceptable",
      assessment: gradeLower(ndEbitda, 2, 3.5, 4.5),
    },
    {
      key: "intCov",
      label: "EBIT Interest Coverage",
      value: intCov,
      display: fmtX(intCov),
      benchmark: "≥ 5x strong (framework), ≥ 3x acceptable",
      assessment: intCov === null ? (interestPaid ? "na" : "strong") : gradeHigher(intCov, 5, 3, 1.5),
    },
    {
      key: "ebitdaIntCov",
      label: "EBITDA Interest Coverage",
      value: ebitdaIntCov,
      display: fmtX(ebitdaIntCov),
      benchmark: "≥ 6x strong, ≥ 4x acceptable",
      assessment: ebitdaIntCov === null ? (interestPaid ? "na" : "strong") : gradeHigher(ebitdaIntCov, 6, 4, 2),
    },
    {
      key: "de",
      label: "Debt / Equity",
      value: de,
      display: fmtX(de, 2),
      benchmark: "≤ 1.0x preferred (framework)",
      assessment: gradeLower(de, 0.6, 1, 2),
    },
    {
      key: "debtFcf",
      label: "Total Debt / Free Cash Flow (payback years)",
      value: debtFcf,
      display: debtFcf === null ? "—" : `${debtFcf.toFixed(1)} yrs`,
      benchmark: "≤ 4 yrs strong, ≤ 7 yrs acceptable",
      assessment: gradeLower(debtFcf, 4, 7, 10),
    },
    {
      key: "ocfDebt",
      label: "Operating Cash Flow / Total Debt",
      value: ocfDebt,
      display: fmtPct(ocfDebt, 0),
      benchmark: "≥ 40% strong, ≥ 20% acceptable",
      assessment: gradeHigher(ocfDebt, 0.4, 0.2, 0.1),
    },
    {
      key: "currentRatio",
      label: "Current Ratio",
      value: currentRatio,
      display: fmtX(currentRatio, 2),
      benchmark: "≥ 1.5x strong, ≥ 1.0x acceptable",
      assessment: gradeHigher(currentRatio, 1.5, 1, 0.8),
    },
    {
      key: "quickRatio",
      label: "Quick Ratio",
      value: quickRatio,
      display: fmtX(quickRatio, 2),
      benchmark: "≥ 1.0x strong",
      assessment: gradeHigher(quickRatio, 1, 0.7, 0.5),
    },
    {
      key: "fcfMargin",
      label: "FCF Margin",
      value: fcfMargin,
      display: fmtPct(fcfMargin),
      benchmark: "≥ 8% strong, ≥ 3% acceptable",
      assessment: gradeHigher(fcfMargin, 0.08, 0.03, 0),
    },
    {
      key: "altman",
      label: "Altman Z-Score",
      value: altman.z,
      display: altman.z === null ? "—" : altman.z.toFixed(2),
      benchmark: "> 2.99 safe, 1.81–2.99 grey, < 1.81 distress",
      assessment:
        altman.zone === "safe"
          ? "strong"
          : altman.zone === "grey"
            ? "watch"
            : altman.zone === "distress"
              ? "weak"
              : "na",
    },
  ];

  // ---- multi-year trend ----
  const trend = data.income.map((inc, i) => {
    const b = data.balance[i];
    const c = data.cashflow[i];
    const nd =
      safe(b?.netDebt) ??
      (safe(b?.totalDebt) !== null && safe(b?.cashAndCashEquivalents) !== null
        ? (b.totalDebt as number) - (b.cashAndCashEquivalents as number)
        : null);
    const ip = safe(c?.interestPaid) ?? safe(inc?.interestExpense);
    const capex = safe(c?.capitalExpenditure);
    return {
      year: inc.fiscalYear ?? inc.date?.slice(0, 4) ?? "",
      revenue: safe(inc?.revenue),
      ebitda: safe(inc?.ebitda),
      netDebtEbitda: div(nd, safe(inc?.ebitda)),
      interestCoverage: ip && ip > 0 ? div(safe(inc?.operatingIncome), ip) : null,
      ocf: safe(c?.operatingCashFlow),
      fcf:
        safe(c?.freeCashFlow) ??
        (safe(c?.operatingCashFlow) !== null && capex !== null
          ? (c.operatingCashFlow as number) + capex
          : null),
    };
  });

  // ---- pro-forma with the requested facility ----
  let proForma: ProForma | null = null;
  if (facility && facility.amount > 0) {
    const newInterest = facility.amount * facility.rate;
    const principal = facility.tenorYears > 0 ? facility.amount / facility.tenorYears : 0;
    const annualDebtService = newInterest + principal;
    const pfNetDebt = (d.netDebt ?? 0) + facility.amount;
    const pfTotalDebt = (d.totalDebt ?? 0) + facility.amount;
    const pfInterest = (interestPaid ?? 0) + newInterest;
    proForma = {
      netDebtEbitda: { before: ndEbitda, after: div(pfNetDebt, d.ebitda) },
      interestCoverage: {
        before: intCov,
        after: pfInterest > 0 ? div(d.ebit, pfInterest) : null,
      },
      debtToEquity: { before: de, after: div(pfTotalDebt, d.equity) },
      annualDebtService,
      dscrProForma:
        debtService + annualDebtService > 0 ? div(d.ocf, debtService + annualDebtService) : null,
    };
  }

  // ---- internal risk rating (1 = minimal risk .. 10 = loss) ----
  const factorScore = (assessment: Assess): number =>
    assessment === "strong" ? 1 : assessment === "acceptable" ? 2 : assessment === "watch" ? 3 : assessment === "weak" ? 4 : 2.5;

  const pick = (key: string) => metrics.find((mt) => mt.key === key)!;
  const factors = [
    { factor: "Leverage (Net Debt/EBITDA)", weight: 0.25, m: pick("ndEbitda"), comment: pick("ndEbitda").display },
    { factor: "Debt service & interest coverage", weight: 0.25, m: pick("dscr").value !== null ? pick("dscr") : pick("intCov"), comment: `DSCR ${pick("dscr").display}, EBIT cover ${pick("intCov").display}` },
    { factor: "Cash flow generation", weight: 0.2, m: pick("fcfMargin"), comment: `FCF margin ${pick("fcfMargin").display}, OCF/debt ${pick("ocfDebt").display}` },
    { factor: "Liquidity", weight: 0.15, m: pick("currentRatio"), comment: `Current ${pick("currentRatio").display}, quick ${pick("quickRatio").display}` },
    { factor: "Solvency (Altman Z)", weight: 0.15, m: pick("altman"), comment: pick("altman").display },
  ];

  const weighted = factors.reduce((s, f) => s + factorScore(f.m.assessment) * f.weight, 0);
  // map weighted 1..4 to grade 1..10
  const grade = Math.round(1 + ((weighted - 1) / 3) * 9);
  const labels: Record<number, string> = {
    1: "Minimal risk", 2: "Modest risk", 3: "Average risk", 4: "Acceptable risk",
    5: "Acceptable with attention", 6: "Watch", 7: "Special mention", 8: "Substandard",
    9: "Doubtful", 10: "Loss",
  };

  return {
    metrics,
    trend,
    proForma,
    rating: {
      grade: Math.min(10, Math.max(1, grade)),
      label: labels[Math.min(10, Math.max(1, grade))],
      factors: factors.map((f) => ({
        factor: f.factor,
        score: factorScore(f.m.assessment),
        weight: f.weight,
        comment: f.comment,
      })),
    },
  };
}
