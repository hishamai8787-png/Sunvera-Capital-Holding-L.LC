// Core data shapes for the Sunvera Analyst engine.
// Statements are ordered most-recent-first (FMP convention).

export interface IncomeStatement {
  date: string;
  fiscalYear: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingIncome: number; // EBIT
  ebitda: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  incomeBeforeTax: number;
  incomeTaxExpense: number;
  interestExpense: number;
  weightedAverageShsOutDil: number;
}

export interface BalanceSheet {
  date: string;
  fiscalYear: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  totalCurrentAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  totalCurrentLiabilities: number;
  totalLiabilities: number;
  totalDebt: number;
  netDebt: number;
  totalStockholdersEquity: number;
  retainedEarnings: number;
  minorityInterest: number;
  preferredStock: number;
}

export interface CashFlowStatement {
  date: string;
  fiscalYear: string;
  operatingCashFlow: number;
  capitalExpenditure: number; // negative in FMP
  freeCashFlow: number;
  netDividendsPaid: number; // negative in FMP
  commonStockRepurchased: number; // negative in FMP
  commonStockIssuance: number;
  interestPaid: number;
  incomeTaxesPaid: number;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  currency: string;
  beta: number;
  price: number;
  marketCap: number;
  lastDividend: number;
  range: string; // "52wLow-52wHigh"
  ceo: string;
  country: string;
  image: string;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercentage: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
  priceAvg50: number;
  priceAvg200: number;
  previousClose: number;
}

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number; // unix seconds
}

export interface CompanyData {
  profile: CompanyProfile;
  quote: Quote;
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashflow: CashFlowStatement[];
  news: NewsItem[];
}

// ---- Engine outputs ----

export type Verdict = "strong" | "good" | "neutral" | "weak" | "poor" | "na";

export interface Metric {
  key: string;
  label: string;
  value: number | null;
  /** Formatted for display, e.g. "18.4%", "2.3x", "$1.2B" */
  display: string;
  verdict: Verdict;
  /** Short note on what it measures / why the verdict */
  note?: string;
}

export interface MetricCategory {
  key: string;
  label: string;
  metrics: Metric[];
}

export interface PiotroskiResult {
  score: number; // 0-9
  tests: { label: string; pass: boolean | null }[];
}

export interface AltmanResult {
  z: number | null;
  zone: "safe" | "grey" | "distress" | "na";
  components: { label: string; value: number | null }[];
}

export interface DcfResult {
  baseFcf: number | null;
  growthRate: number;
  discountRate: number;
  terminalGrowth: number;
  years: number;
  fairValuePerShare: number | null;
  currentPrice: number;
  marginOfSafety: number | null; // (fair - price) / fair
}

export interface ScoreBreakdown {
  category: string;
  weight: number;
  earned: number;
  detail: string;
}

export interface ScoreResult {
  total: number; // 0-100
  rating: "Exceptional" | "Excellent" | "Good" | "Fair" | "Weak";
  breakdown: ScoreBreakdown[];
}

export interface GrowthRow {
  metric: string;
  yoy: number | null;
  cagr3: number | null;
  cagr5: number | null;
  cagr10: number | null;
}

export interface AnalysisReport {
  symbol: string;
  generatedAt: string;
  profile: CompanyProfile;
  quote: Quote;
  categories: MetricCategory[];
  growth: GrowthRow[];
  piotroski: PiotroskiResult;
  altman: AltmanResult;
  dcf: DcfResult;
  score: ScoreResult;
  narrative: { title: string; paragraphs: string[] }[];
  news: NewsItem[];
  yearsOfData: number;
}
