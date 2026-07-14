// Orchestrator: fetch all data for a ticker and produce the full AnalysisReport.

import type { AnalysisReport, CompanyData } from "./types";
import { getProfile, getQuote, getIncomeStatements, getBalanceSheets, getCashFlows } from "./fmp";
import { getCompanyNews } from "./finnhub";
import { derive, buildCategories, buildGrowth } from "./ratios";
import { altmanZ, piotroskiF, dcf, scoreCompany } from "./scoring";
import { buildNarrative } from "./narrative";

export async function analyzeCompany(symbolRaw: string): Promise<AnalysisReport> {
  const symbol = symbolRaw.trim().toUpperCase();

  const [profile, quote, incomeRaw, balanceRaw, cashflowRaw, news] = await Promise.all([
    getProfile(symbol),
    getQuote(symbol),
    getIncomeStatements(symbol),
    getBalanceSheets(symbol),
    getCashFlows(symbol),
    getCompanyNews(symbol),
  ]);

  // FMP publishes placeholder rows of zeros for fiscal years whose filing isn't
  // processed yet — drop those, then keep only years present in all three
  // statements so index i always refers to the same fiscal year everywhere.
  const income = incomeRaw.filter((s) => s.revenue || s.netIncome);
  const balance = balanceRaw.filter((s) => s.totalAssets);
  const cashflow = cashflowRaw.filter(
    (s) => s.operatingCashFlow || s.freeCashFlow || s.capitalExpenditure
  );
  const years = income
    .map((s) => s.fiscalYear)
    .filter(
      (y) => balance.some((b) => b.fiscalYear === y) && cashflow.some((c) => c.fiscalYear === y)
    );

  if (!years.length) {
    throw new Error(
      `Financial statements are not available for ${symbol} on your current data plan.`
    );
  }

  const data: CompanyData = {
    profile,
    quote,
    income: years.map((y) => income.find((s) => s.fiscalYear === y)!),
    balance: years.map((y) => balance.find((s) => s.fiscalYear === y)!),
    cashflow: years.map((y) => cashflow.find((s) => s.fiscalYear === y)!),
    news,
  };
  const d = derive(data);
  const categories = buildCategories(data, d);
  const growth = buildGrowth(data);
  const altman = altmanZ(data, d);
  const piotroski = piotroskiF(data);
  const dcfRes = dcf(data, d);
  const score = scoreCompany({ data, d, altman, piotroski, dcfRes });
  const narrative = buildNarrative(data, d, growth, altman, piotroski, dcfRes, score);

  return {
    symbol,
    generatedAt: new Date().toISOString(),
    profile,
    quote,
    categories,
    growth,
    piotroski,
    altman,
    dcf: dcfRes,
    score,
    narrative,
    news,
    yearsOfData: income.length,
  };
}
