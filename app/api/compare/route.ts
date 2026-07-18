// GET /api/compare?symbols=AAPL,MSFT,GOOGL — side-by-side company comparison
import { NextResponse } from "next/server";
import { getProfile, getQuote, getIncomeStatements, getBalanceSheets, getCashFlows } from "@/lib/fmp";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";

export const revalidate = 300; // 5 min

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "compare");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const raw = sanitizeString(searchParams.get("symbols") ?? "", 200);
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  if (symbols.length < 2) {
    return NextResponse.json(
      { error: "Provide at least 2 ticker symbols (max 5)." },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.allSettled(
      symbols.map(async (sym) => {
        const [profile, quote, income, balance, cashflow] = await Promise.all([
          getProfile(sym),
          getQuote(sym),
          getIncomeStatements(sym, 1),
          getBalanceSheets(sym, 1),
          getCashFlows(sym, 1),
        ]);
        return { profile, quote, income: income[0], balance: balance[0], cashflow: cashflow[0] };
      })
    );

    const companies = results.map((r, i) => {
      if (r.status !== "fulfilled") return { symbol: symbols[i], error: "Data unavailable" };
      const c = r.value;
      const profile = c.profile;
      const quote = c.quote;
      const inc = c.income;
      const bs = c.balance;
      const cf = c.cashflow;

      const revenue = inc?.revenue ?? 0;
      const netIncome = inc?.netIncome ?? 0;
      const ebitda = inc?.ebitda ?? 0;
      const totalDebt = bs?.totalDebt ?? 0;
      const totalEquity = bs?.totalStockholdersEquity ?? 0;
      const totalAssets = bs?.totalAssets ?? 0;
      const fcf = cf?.freeCashFlow ?? 0;
      const ocf = cf?.operatingCashFlow ?? 0;

      return {
        symbol: symbols[i],
        name: profile.companyName,
        sector: profile.sector,
        industry: profile.industry,
        exchange: profile.exchange,
        marketCap: profile.marketCap,
        price: quote?.price ?? profile.price,
        changePercent: quote?.changePercentage ?? 0,
        beta: profile.beta,
        peRatio: netIncome > 0 && profile.marketCap > 0 ? profile.marketCap / netIncome : null,
        eps: inc?.eps ?? null,
        dividendYield: profile.lastDividend > 0 && profile.price > 0
          ? (profile.lastDividend / profile.price) * 100
          : 0,
        profitMargin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
        ebitdaMargin: revenue > 0 ? (ebitda / revenue) * 100 : 0,
        roe: totalEquity > 0 ? (netIncome / totalEquity) * 100 : 0,
        roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
        debtToEquity: totalEquity > 0 ? totalDebt / totalEquity : 0,
        currentRatio: bs && bs.totalCurrentAssets && bs.totalCurrentLiabilities > 0
          ? bs.totalCurrentAssets / bs.totalCurrentLiabilities
          : 0,
        fcfYield: profile.marketCap > 0 ? (fcf / profile.marketCap) * 100 : 0,
        ocfPerShare: inc?.weightedAverageShsOutDil
          ? ocf / inc.weightedAverageShsOutDil
          : 0,
        description: profile.description?.slice(0, 300),
        country: profile.country,
        currency: profile.currency,
        image: profile.image,
      };
    });

    return NextResponse.json(
      { companies },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (err) {
    console.error("[compare] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Comparison failed. Please try again." },
      { status: 500 }
    );
  }
}
