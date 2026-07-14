// Ratio engine — implements the metric catalogue from the
// "Complete Professional Stock Analysis Framework" (Sections 1-9).
// All inputs come from CompanyData; statements are most-recent-first.

import type {
  CompanyData,
  Metric,
  MetricCategory,
  GrowthRow,
  Verdict,
} from "./types";

// ---------- helpers ----------

const safe = (n: number | null | undefined): number | null =>
  typeof n === "number" && isFinite(n) ? n : null;

const div = (a: number | null | undefined, b: number | null | undefined): number | null => {
  const x = safe(a);
  const y = safe(b);
  if (x === null || y === null || y === 0) return null;
  return x / y;
};

const avg2 = (curr: number | null | undefined, prev: number | null | undefined): number | null => {
  const c = safe(curr);
  const p = safe(prev);
  if (c === null) return null;
  if (p === null) return c;
  return (c + p) / 2;
};

export const cagr = (latest: number | null, past: number | null, years: number): number | null => {
  if (latest === null || past === null || past <= 0 || latest <= 0 || years <= 0) return null;
  return Math.pow(latest / past, 1 / years) - 1;
};

// formatting
export const pct = (v: number | null, digits = 1): string =>
  v === null ? "—" : `${(v * 100).toFixed(digits)}%`;

export const times = (v: number | null, digits = 2): string =>
  v === null ? "—" : `${v.toFixed(digits)}x`;

export const num = (v: number | null, digits = 2): string =>
  v === null ? "—" : v.toFixed(digits);

export const money = (v: number | null, currency = "USD"): string => {
  if (v === null) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const sym = currency === "USD" ? "$" : `${currency} `;
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${sym}${abs.toFixed(2)}`;
};

const days = (v: number | null): string => (v === null ? "—" : `${v.toFixed(0)} days`);

// verdict helpers: higher-is-better / lower-is-better with thresholds
const hib = (v: number | null, good: number, ok: number): Verdict => {
  if (v === null) return "na";
  if (v >= good) return "strong";
  if (v >= ok) return "good";
  if (v >= 0) return "neutral";
  return "weak";
};
const lib = (v: number | null, good: number, ok: number): Verdict => {
  if (v === null) return "na";
  if (v <= good) return "strong";
  if (v <= ok) return "good";
  return "weak";
};

const m = (
  key: string,
  label: string,
  value: number | null,
  display: string,
  verdict: Verdict = "na",
  note?: string
): Metric => ({ key, label, value, display, verdict, note });

// ---------- derived fundamentals ----------

export interface Derived {
  price: number;
  marketCap: number;
  shares: number;
  currency: string;

  revenue: number | null;
  grossProfit: number | null;
  ebit: number | null;
  ebitda: number | null;
  netIncome: number | null;
  eps: number | null;
  taxRate: number | null;
  nopat: number | null;
  interestExpense: number | null;

  cash: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  equity: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  workingCapital: number | null;
  investedCapital: number | null;
  capitalEmployed: number | null;

  ocf: number | null;
  capex: number | null; // positive number
  fcf: number | null;
  dividendsPaid: number | null; // positive number
  buybacks: number | null; // net, positive = net repurchase

  enterpriseValue: number | null;
  dps: number | null;
  bookValuePerShare: number | null;
  fcfPerShare: number | null;
}

export function derive(data: CompanyData): Derived {
  const inc = data.income[0];
  const bal = data.balance[0];
  const cf = data.cashflow[0];
  const price = data.quote.price ?? data.profile.price;
  const shares = safe(inc?.weightedAverageShsOutDil) ?? 0;
  const marketCap = safe(data.quote.marketCap) ?? (shares && price ? shares * price : 0);

  const totalDebt = safe(bal?.totalDebt);
  const cash = safe(bal?.cashAndCashEquivalents);
  const netDebt =
    safe(bal?.netDebt) ?? (totalDebt !== null && cash !== null ? totalDebt - cash : null);
  const equity = safe(bal?.totalStockholdersEquity);

  const pretax = safe(inc?.incomeBeforeTax);
  const tax = safe(inc?.incomeTaxExpense);
  const taxRate =
    pretax !== null && tax !== null && pretax > 0 ? Math.min(Math.max(tax / pretax, 0), 0.5) : 0.21;
  const ebit = safe(inc?.operatingIncome);
  const nopat = ebit !== null ? ebit * (1 - taxRate) : null;

  const capexRaw = safe(cf?.capitalExpenditure);
  const capex = capexRaw !== null ? Math.abs(capexRaw) : null;
  const ocf = safe(cf?.operatingCashFlow);
  const fcf = safe(cf?.freeCashFlow) ?? (ocf !== null && capex !== null ? ocf - capex : null);

  const divPaidRaw = safe(cf?.netDividendsPaid);
  const dividendsPaid = divPaidRaw !== null ? Math.abs(divPaidRaw) : null;
  const repurchased = safe(cf?.commonStockRepurchased);
  const issued = safe(cf?.commonStockIssuance) ?? 0;
  const buybacks = repurchased !== null ? Math.abs(repurchased) - issued : null;

  const currentAssets = safe(bal?.totalCurrentAssets);
  const currentLiabilities = safe(bal?.totalCurrentLiabilities);
  const workingCapital =
    currentAssets !== null && currentLiabilities !== null
      ? currentAssets - currentLiabilities
      : null;

  const enterpriseValue =
    marketCap && totalDebt !== null && cash !== null
      ? marketCap +
        totalDebt +
        (safe(bal?.preferredStock) ?? 0) +
        (safe(bal?.minorityInterest) ?? 0) -
        cash
      : marketCap || null;

  return {
    price,
    marketCap,
    shares,
    currency: data.profile.currency || "USD",
    revenue: safe(inc?.revenue),
    grossProfit: safe(inc?.grossProfit),
    ebit,
    ebitda: safe(inc?.ebitda),
    netIncome: safe(inc?.netIncome),
    eps: safe(inc?.epsDiluted) ?? safe(inc?.eps),
    taxRate,
    nopat,
    interestExpense: safe(inc?.interestExpense),
    cash,
    totalDebt,
    netDebt,
    equity,
    totalAssets: safe(bal?.totalAssets),
    totalLiabilities: safe(bal?.totalLiabilities),
    currentAssets,
    currentLiabilities,
    workingCapital,
    investedCapital:
      equity !== null && totalDebt !== null && cash !== null ? equity + totalDebt - cash : null,
    capitalEmployed:
      safe(bal?.totalAssets) !== null && currentLiabilities !== null
        ? (safe(bal?.totalAssets) as number) - currentLiabilities
        : null,
    ocf,
    capex,
    fcf,
    dividendsPaid,
    buybacks,
    enterpriseValue,
    dps: shares ? div(dividendsPaid, shares) : null,
    bookValuePerShare: shares ? div(equity, shares) : null,
    fcfPerShare: shares ? div(fcf, shares) : null,
  };
}

// ---------- category builders ----------

export function buildCategories(data: CompanyData, d: Derived): MetricCategory[] {
  const inc = data.income;
  const bal = data.balance;
  const cur = d.currency;

  // --- Valuation (Section 2) ---
  const pe = div(d.price, d.eps);
  const epsCagr3 = cagr(safe(inc[0]?.epsDiluted), safe(inc[3]?.epsDiluted), 3);
  const peg = pe !== null && epsCagr3 !== null && epsCagr3 > 0 ? pe / (epsCagr3 * 100) : null;
  const pb = div(d.price, d.bookValuePerShare);
  const ps = div(d.marketCap, d.revenue);
  const evRev = div(d.enterpriseValue, d.revenue);
  const evEbitda = div(d.enterpriseValue, d.ebitda);
  const evEbit = div(d.enterpriseValue, d.ebit);
  const pFcf = div(d.marketCap, d.fcf);
  const fcfYield = div(d.fcf, d.marketCap);
  const earningsYield = div(d.eps, d.price);
  const divYield = div(d.dps, d.price);
  const buybackYield = div(d.buybacks, d.marketCap);
  const shareholderYield =
    divYield !== null || buybackYield !== null
      ? (divYield ?? 0) + (buybackYield ?? 0)
      : null;

  const valuation: Metric[] = [
    m("pe", "P/E Ratio", pe, times(pe), lib(pe, 15, 25), "Price paid per unit of earnings"),
    m("peg", "PEG Ratio", peg, num(peg), lib(peg, 1, 2), "Growth-adjusted valuation (3y EPS CAGR)"),
    m("pb", "P/B Ratio", pb, times(pb), lib(pb, 1.5, 3), "Price vs accounting equity"),
    m("ps", "P/S Ratio", ps, times(ps), lib(ps, 2, 5), "Price vs sales"),
    m("evRev", "EV/Revenue", evRev, times(evRev), lib(evRev, 2, 5)),
    m("evEbitda", "EV/EBITDA", evEbitda, times(evEbitda), lib(evEbitda, 10, 15)),
    m("evEbit", "EV/EBIT", evEbit, times(evEbit), lib(evEbit, 12, 18)),
    m("pFcf", "Price to FCF", pFcf, times(pFcf), lib(pFcf, 15, 25)),
    m("fcfYield", "FCF Yield", fcfYield, pct(fcfYield), hib(fcfYield, 0.06, 0.04)),
    m("earningsYield", "Earnings Yield", earningsYield, pct(earningsYield), hib(earningsYield, 0.06, 0.04)),
    m("divYield", "Dividend Yield", divYield, pct(divYield), hib(divYield, 0.03, 0.015)),
    m("buybackYield", "Buyback Yield", buybackYield, pct(buybackYield), hib(buybackYield, 0.02, 0.005)),
    m("shYield", "Shareholder Yield", shareholderYield, pct(shareholderYield), hib(shareholderYield, 0.05, 0.025), "Dividends + net buybacks vs market cap"),
  ];

  // --- Profitability (Section 3) ---
  const grossMargin = div(d.grossProfit, d.revenue);
  const opMargin = div(d.ebit, d.revenue);
  const ebitdaMargin = div(d.ebitda, d.revenue);
  const netMargin = div(d.netIncome, d.revenue);
  const pretaxMargin = div(safe(inc[0]?.incomeBeforeTax), d.revenue);
  const nopatMargin = div(d.nopat, d.revenue);
  const roe = div(d.netIncome, avg2(d.equity, safe(bal[1]?.totalStockholdersEquity)));
  const roa = div(d.netIncome, avg2(d.totalAssets, safe(bal[1]?.totalAssets)));
  const roic = div(d.nopat, d.investedCapital);
  const roce = div(d.ebit, d.capitalEmployed);

  const profitability: Metric[] = [
    m("grossMargin", "Gross Margin", grossMargin, pct(grossMargin), hib(grossMargin, 0.4, 0.25), "Pricing power and production efficiency"),
    m("opMargin", "Operating Margin", opMargin, pct(opMargin), hib(opMargin, 0.15, 0.08)),
    m("ebitdaMargin", "EBITDA Margin", ebitdaMargin, pct(ebitdaMargin), hib(ebitdaMargin, 0.2, 0.12)),
    m("netMargin", "Net Margin", netMargin, pct(netMargin), hib(netMargin, 0.1, 0.05)),
    m("pretaxMargin", "Pre-Tax Margin", pretaxMargin, pct(pretaxMargin), hib(pretaxMargin, 0.12, 0.06)),
    m("nopatMargin", "NOPAT Margin", nopatMargin, pct(nopatMargin), hib(nopatMargin, 0.12, 0.06)),
    m("roe", "ROE", roe, pct(roe), hib(roe, 0.15, 0.1), "Framework target: above 15%"),
    m("roa", "ROA", roa, pct(roa), hib(roa, 0.08, 0.05)),
    m("roic", "ROIC", roic, pct(roic), hib(roic, 0.15, 0.1), "Framework target: above 15%"),
    m("roce", "ROCE", roce, pct(roce), hib(roce, 0.15, 0.1)),
  ];

  // --- Financial strength & liquidity (Section 4) ---
  const currentRatio = div(d.currentAssets, d.currentLiabilities);
  const quick = div(
    (d.cash ?? 0) + (safe(bal[0]?.shortTermInvestments) ?? 0) + (safe(bal[0]?.netReceivables) ?? 0),
    d.currentLiabilities
  );
  const cashRatio = div(d.cash, d.currentLiabilities);
  const de = div(d.totalDebt, d.equity);
  const da = div(d.totalDebt, d.totalAssets);
  const ndEbitda = div(d.netDebt, d.ebitda);
  const intCov = d.interestExpense && d.interestExpense > 0 ? div(d.ebit, d.interestExpense) : null;
  const equityRatio = div(d.equity, d.totalAssets);
  const liabAssets = div(d.totalLiabilities, d.totalAssets);
  const cashToDebt = div(d.cash, d.totalDebt);

  const strength: Metric[] = [
    m("currentRatio", "Current Ratio", currentRatio, times(currentRatio), hib(currentRatio, 2, 1.2), "Short-term liquidity"),
    m("quickRatio", "Quick Ratio", quick, times(quick), hib(quick, 1.2, 0.8), "Liquidity excluding inventory"),
    m("cashRatio", "Cash Ratio", cashRatio, times(cashRatio), hib(cashRatio, 0.5, 0.25)),
    m("de", "Debt-to-Equity", de, times(de), lib(de, 0.5, 1), "Framework target: below 1.0 (sector dependent)"),
    m("da", "Debt-to-Assets", da, times(da), lib(da, 0.3, 0.5)),
    m("netDebt", "Net Debt", d.netDebt, money(d.netDebt, cur), d.netDebt !== null && d.netDebt < 0 ? "strong" : "neutral", "Negative = net cash position"),
    m("ndEbitda", "Net Debt / EBITDA", ndEbitda, times(ndEbitda), lib(ndEbitda, 1, 3), "Debt repayment capacity"),
    m("intCov", "Interest Coverage", intCov, times(intCov, 1), hib(intCov, 8, 5), "Framework target: above 5x"),
    m("equityRatio", "Equity Ratio", equityRatio, pct(equityRatio), hib(equityRatio, 0.5, 0.3)),
    m("liabAssets", "Liabilities-to-Assets", liabAssets, pct(liabAssets), lib(liabAssets, 0.5, 0.7)),
    m("cashToDebt", "Cash-to-Debt", cashToDebt, times(cashToDebt), hib(cashToDebt, 1, 0.5)),
  ];

  // --- Cash flow & FCF (Section 5) ---
  const fcfMargin = div(d.fcf, d.revenue);
  const fcfConversion = div(d.fcf, d.netIncome);
  const ocfMargin = div(d.ocf, d.revenue);
  const cashConversion = div(d.ocf, d.netIncome);
  const capexRatio = div(d.capex, d.ocf);
  const divCovFcf = d.dividendsPaid && d.dividendsPaid > 0 ? div(d.fcf, d.dividendsPaid) : null;
  const fcfAfterDiv =
    d.fcf !== null && d.dividendsPaid !== null ? d.fcf - d.dividendsPaid : d.fcf;

  const cashflow: Metric[] = [
    m("ocf", "Operating Cash Flow", d.ocf, money(d.ocf, cur), hib(d.ocf, 1, 0)),
    m("capex", "Capital Expenditures", d.capex, money(d.capex, cur), "neutral"),
    m("fcf", "Free Cash Flow", d.fcf, money(d.fcf, cur), d.fcf !== null && d.fcf > 0 ? "strong" : "weak", "Framework target: positive and consistent"),
    m("fcfPerShare", "FCF per Share", d.fcfPerShare, money(d.fcfPerShare, cur)),
    m("fcfMargin", "FCF Margin", fcfMargin, pct(fcfMargin), hib(fcfMargin, 0.1, 0.05)),
    m("fcfConversion", "FCF Conversion", fcfConversion, pct(fcfConversion), hib(fcfConversion, 0.9, 0.7), "FCF / net income — earnings quality"),
    m("ocfMargin", "OCF Margin", ocfMargin, pct(ocfMargin), hib(ocfMargin, 0.15, 0.08)),
    m("cashConversion", "Cash Conversion Ratio", cashConversion, pct(cashConversion), hib(cashConversion, 1, 0.8), "Framework: OCF > net income preferred"),
    m("capexRatio", "Capex Ratio", capexRatio, pct(capexRatio), lib(capexRatio, 0.3, 0.5), "Share of OCF consumed by capex"),
    m("divCovFcf", "Dividend Coverage by FCF", divCovFcf, times(divCovFcf, 1), hib(divCovFcf, 2, 1.2)),
    m("fcfAfterDiv", "FCF After Dividends", fcfAfterDiv, money(fcfAfterDiv, cur), fcfAfterDiv !== null && fcfAfterDiv > 0 ? "strong" : "weak"),
  ];

  // --- Dividends (Section 7) ---
  const payoutEarnings = d.dividendsPaid && d.netIncome ? div(d.dividendsPaid, d.netIncome) : null;
  const payoutFcf = d.dividendsPaid && d.fcf ? div(d.dividendsPaid, d.fcf) : null;
  const divCoverage = d.dividendsPaid && d.dividendsPaid > 0 ? div(d.netIncome, d.dividendsPaid) : null;

  const dividends: Metric[] = [
    m("dps", "Dividend per Share", d.dps, money(d.dps, cur)),
    m("divYield2", "Dividend Yield", divYield, pct(divYield), hib(divYield, 0.03, 0.015)),
    m("payoutEarnings", "Earnings Payout Ratio", payoutEarnings, pct(payoutEarnings), lib(payoutEarnings, 0.5, 0.75), "Dividend share of earnings"),
    m("payoutFcf", "Cash Payout Ratio", payoutFcf, pct(payoutFcf), lib(payoutFcf, 0.5, 0.75), "Dividend share of free cash flow"),
    m("divCoverage", "Dividend Coverage", divCoverage, times(divCoverage, 1), hib(divCoverage, 2, 1.3)),
  ];

  // --- Efficiency (Section 8) ---
  const cogs = safe(inc[0]?.costOfRevenue);
  const assetTurnover = div(d.revenue, avg2(d.totalAssets, safe(bal[1]?.totalAssets)));
  const invTurnover = div(cogs, avg2(safe(bal[0]?.inventory), safe(bal[1]?.inventory)));
  const recTurnover = div(d.revenue, avg2(safe(bal[0]?.netReceivables), safe(bal[1]?.netReceivables)));
  const payTurnover = div(cogs, avg2(safe(bal[0]?.accountPayables), safe(bal[1]?.accountPayables)));
  const dso = div(avg2(safe(bal[0]?.netReceivables), safe(bal[1]?.netReceivables)), d.revenue !== null ? d.revenue / 365 : null);
  const dio = div(avg2(safe(bal[0]?.inventory), safe(bal[1]?.inventory)), cogs !== null ? cogs / 365 : null);
  const dpo = div(avg2(safe(bal[0]?.accountPayables), safe(bal[1]?.accountPayables)), cogs !== null ? cogs / 365 : null);
  const ccc = dso !== null && dio !== null && dpo !== null ? dso + dio - dpo : null;
  const wcTurnover = d.workingCapital && d.workingCapital > 0 ? div(d.revenue, d.workingCapital) : null;

  const efficiency: Metric[] = [
    m("assetTurnover", "Asset Turnover", assetTurnover, times(assetTurnover), hib(assetTurnover, 1, 0.5)),
    m("invTurnover", "Inventory Turnover", invTurnover, times(invTurnover, 1)),
    m("recTurnover", "Receivables Turnover", recTurnover, times(recTurnover, 1)),
    m("payTurnover", "Payables Turnover", payTurnover, times(payTurnover, 1)),
    m("dso", "Days Sales Outstanding", dso, days(dso), lib(dso, 45, 75)),
    m("dio", "Days Inventory Outstanding", dio, days(dio), lib(dio, 60, 100)),
    m("dpo", "Days Payables Outstanding", dpo, days(dpo)),
    m("ccc", "Cash Conversion Cycle", ccc, days(ccc), lib(ccc, 30, 75), "DSO + DIO − DPO"),
    m("wcTurnover", "Working Capital Turnover", wcTurnover, times(wcTurnover, 1)),
  ];

  return [
    { key: "valuation", label: "Valuation", metrics: valuation },
    { key: "profitability", label: "Profitability", metrics: profitability },
    { key: "strength", label: "Financial Strength & Liquidity", metrics: strength },
    { key: "cashflow", label: "Cash Flow & FCF", metrics: cashflow },
    { key: "dividends", label: "Dividend Analysis", metrics: dividends },
    { key: "efficiency", label: "Efficiency", metrics: efficiency },
  ];
}

// ---------- growth table (Section 6) ----------

export function buildGrowth(data: CompanyData): GrowthRow[] {
  const inc = data.income;
  const cf = data.cashflow;
  const bal = data.balance;
  const n = inc.length;

  const series = (get: (i: number) => number | null): ((yrs: number) => number | null) => {
    return (yrs: number) => {
      if (yrs >= n) return null;
      return cagr(get(0), get(yrs), yrs);
    };
  };
  const yoy = (get: (i: number) => number | null): number | null => {
    const c = get(0);
    const p = get(1);
    if (c === null || p === null || p === 0) return null;
    return (c - p) / Math.abs(p);
  };

  const rows: { metric: string; get: (i: number) => number | null }[] = [
    { metric: "Revenue", get: (i) => safe(inc[i]?.revenue) },
    { metric: "EPS (diluted)", get: (i) => safe(inc[i]?.epsDiluted) },
    { metric: "Net Income", get: (i) => safe(inc[i]?.netIncome) },
    { metric: "EBITDA", get: (i) => safe(inc[i]?.ebitda) },
    {
      metric: "Free Cash Flow",
      get: (i) => {
        const f = safe(cf[i]?.freeCashFlow);
        if (f !== null) return f;
        const o = safe(cf[i]?.operatingCashFlow);
        const c = safe(cf[i]?.capitalExpenditure);
        return o !== null && c !== null ? o + c : null; // capex negative
      },
    },
    {
      metric: "Dividends Paid",
      get: (i) => {
        const v = safe(cf[i]?.netDividendsPaid);
        return v !== null ? Math.abs(v) : null;
      },
    },
    { metric: "Book Value", get: (i) => safe(bal[i]?.totalStockholdersEquity) },
  ];

  return rows.map((r) => {
    const s = series(r.get);
    return {
      metric: r.metric,
      yoy: yoy(r.get),
      cagr3: s(3),
      cagr5: s(5),
      cagr10: s(Math.min(10, n - 1) >= 7 ? Math.min(10, n - 1) : 10),
    };
  });
}
