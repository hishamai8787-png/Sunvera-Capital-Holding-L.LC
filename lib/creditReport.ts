// Orchestrator for the credit proposal: data → credit assessment → peers → narrative.

import type { CompanyData, CompanyProfile } from "./types";
import {
  getProfile,
  getQuote,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlows,
} from "./fmp";
import { derive, type Derived } from "./ratios";
import { altmanZ } from "./scoring";
import {
  buildCreditAssessment,
  type CreditAssessment,
  type FacilityInput,
} from "./credit";
import { comparePeers, type PeerComparison } from "./peers";
import { buildCreditNarrative, type CreditSection } from "./creditNarrative";

export interface CreditReport {
  symbol: string;
  generatedAt: string;
  profile: CompanyProfile;
  currency: string;
  facility: FacilityInput | null;
  assessment: CreditAssessment;
  peers: PeerComparison | null;
  narrative: CreditSection[];
  derived: {
    revenue: number | null;
    ebitda: number | null;
    ocf: number | null;
    fcf: number | null;
    totalDebt: number | null;
    netDebt: number | null;
    equity: number | null;
  };
}

export async function buildCreditReport(
  symbolRaw: string,
  facility: FacilityInput | null,
  peerSymbols: string[]
): Promise<CreditReport> {
  const symbol = symbolRaw.trim().toUpperCase();

  const [profile, quote, incomeRaw, balanceRaw, cashflowRaw] = await Promise.all([
    getProfile(symbol),
    getQuote(symbol),
    getIncomeStatements(symbol),
    getBalanceSheets(symbol),
    getCashFlows(symbol),
  ]);

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
    throw new Error(`Financial statements are not available for ${symbol}.`);
  }

  const data: CompanyData = {
    profile,
    quote,
    income: years.map((y) => income.find((s) => s.fiscalYear === y)!),
    balance: years.map((y) => balance.find((s) => s.fiscalYear === y)!),
    cashflow: years.map((y) => cashflow.find((s) => s.fiscalYear === y)!),
    news: [],
  };

  const d: Derived = derive(data);
  const altman = altmanZ(data, d);
  const assessment = buildCreditAssessment(data, d, altman, facility);

  let peers: PeerComparison | null = null;
  try {
    peers = await comparePeers(symbol, peerSymbols);
    if (!peers.peers.length) peers = null;
  } catch {
    peers = null;
  }

  const narrative = buildCreditNarrative(data, d, assessment, peers, facility);

  return {
    symbol,
    generatedAt: new Date().toISOString(),
    profile,
    currency: d.currency,
    facility,
    assessment,
    peers,
    narrative,
    derived: {
      revenue: d.revenue,
      ebitda: d.ebitda,
      ocf: d.ocf,
      fcf: d.fcf,
      totalDebt: d.totalDebt,
      netDebt: d.netDebt,
      equity: d.equity,
    },
  };
}
