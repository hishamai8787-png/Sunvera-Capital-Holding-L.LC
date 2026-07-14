// Narrative generator — turns the ratio engine's output into flowing,
// causally-linked prose per the framework's philosophy: explain how margins
// flow into returns, returns into cash, cash into balance-sheet strength,
// and how all of it justifies (or doesn't) the current valuation.

import type { CompanyData, AltmanResult, PiotroskiResult, DcfResult, ScoreResult, GrowthRow } from "./types";
import { pct, money, times, type Derived } from "./ratios";

interface Section {
  title: string;
  paragraphs: string[];
}

const r = (v: number | null | undefined): number | null =>
  typeof v === "number" && isFinite(v) ? v : null;
const dv = (a: number | null, b: number | null) => (a !== null && b !== null && b !== 0 ? a / b : null);

export function buildNarrative(
  data: CompanyData,
  d: Derived,
  growth: GrowthRow[],
  altman: AltmanResult,
  piotroski: PiotroskiResult,
  dcfRes: DcfResult,
  score: ScoreResult
): Section[] {
  const name = data.profile.companyName || data.profile.symbol;
  const cur = d.currency;
  const inc = data.income;
  const sections: Section[] = [];

  // ---- derived values used across sections ----
  const grossMargin = dv(d.grossProfit, d.revenue);
  const opMargin = dv(d.ebit, d.revenue);
  const netMargin = dv(d.netIncome, d.revenue);
  const grossMarginPrev = dv(r(inc[1]?.grossProfit), r(inc[1]?.revenue));
  const opMarginPrev = dv(r(inc[1]?.operatingIncome), r(inc[1]?.revenue));
  const equityPrev = r(data.balance[1]?.totalStockholdersEquity);
  const avgEquity = d.equity !== null && equityPrev !== null ? (d.equity + equityPrev) / 2 : d.equity;
  const roe = dv(d.netIncome, avgEquity);
  const roic = dv(d.nopat, d.investedCapital);
  const de = dv(d.totalDebt, d.equity);
  const intCov = d.interestExpense && d.interestExpense > 0 ? dv(d.ebit, d.interestExpense) : null;
  const currentRatio = dv(d.currentAssets, d.currentLiabilities);
  const cashConv = dv(d.ocf, d.netIncome);
  const fcfMargin = dv(d.fcf, d.revenue);
  const fcfYield = dv(d.fcf, d.marketCap);
  const pe = dv(d.price, d.eps);
  const ndEbitda = dv(d.netDebt, d.ebitda);
  const revGrowth = growth.find((g) => g.metric === "Revenue");
  const epsGrowth = growth.find((g) => g.metric === "EPS (diluted)");
  const fcfGrowth = growth.find((g) => g.metric === "Free Cash Flow");

  const dir = (v: number | null) => (v === null ? null : v > 0.005 ? "expanded" : v < -0.005 ? "compressed" : "held steady");

  // ---- 1. Overview ----
  {
    const p: string[] = [];
    p.push(
      `${name} (${data.profile.symbol}) operates in the ${data.profile.industry || data.profile.sector} industry on the ${data.profile.exchange}, with a market capitalization of ${money(d.marketCap, cur)} at the current share price of ${money(d.price, cur)}. ` +
        `The company scores ${score.total}/100 on the Sunvera framework — rated “${score.rating}.”`
    );
    const strongest = [...score.breakdown].sort((a, b) => b.earned / b.weight - a.earned / a.weight);
    const best = strongest[0];
    const worst = strongest[strongest.length - 1];
    p.push(
      `Its strongest pillar is ${best.category.toLowerCase()} (${best.earned}/${best.weight} points) and its weakest is ${worst.category.toLowerCase()} (${worst.earned}/${worst.weight}). The sections below trace how those outcomes connect — from the income statement through the cash flow statement to the balance sheet, and finally to what the market is asking you to pay for it.`
    );
    sections.push({ title: "Overview", paragraphs: p });
  }

  // ---- 2. Profitability: margins → returns ----
  {
    const p: string[] = [];
    if (grossMargin !== null) {
      const gmMove = grossMarginPrev !== null ? grossMargin - grossMarginPrev : null;
      let s = `The profit story starts at the top of the income statement: ${name} converts revenue of ${money(d.revenue, cur)} into a gross margin of ${pct(grossMargin)}`;
      if (gmMove !== null) s += `, which ${dir(gmMove)} versus the prior year${gmMove !== null && Math.abs(gmMove) > 0.005 ? ` (${gmMove > 0 ? "+" : ""}${(gmMove * 100).toFixed(1)}pp)` : ""}`;
      s += grossMargin >= 0.4
        ? ` — a level that typically signals real pricing power rather than commodity economics.`
        : grossMargin >= 0.25
          ? ` — respectable, though not the mark of a business that can name its price.`
          : ` — thin, which means everything below the gross line has to be managed tightly for profit to survive.`;
      p.push(s);
    }
    if (opMargin !== null && grossMargin !== null) {
      const spread = grossMargin - opMargin;
      const opMove = opMarginPrev !== null ? opMargin - opMarginPrev : null;
      p.push(
        `Of that gross profit, operating costs absorb ${pct(spread)} of revenue, leaving an operating margin of ${pct(opMargin)}${opMove !== null ? ` (${dir(opMove)} year-over-year)` : ""}. ` +
          (netMargin !== null
            ? `After interest and tax, ${pct(netMargin)} of every revenue dollar reaches the bottom line.`
            : "")
      );
    }
    if (roe !== null || roic !== null) {
      let s = `What matters is what those margins earn on the capital tied up in the business: `;
      const bits: string[] = [];
      if (roic !== null)
        bits.push(
          `ROIC of ${pct(roic)} is ${roic >= 0.15 ? "above" : "below"} the framework's 15% bar${roic >= 0.15 ? " — the business creates value on every incremental dollar it reinvests" : " — reinvested capital is earning less than a quality compounder should"}`
        );
      if (roe !== null)
        bits.push(
          `ROE stands at ${pct(roe)}${de !== null && de > 1 && roe !== null && roe > 0.15 ? ", though note this is amplified by leverage rather than pure operating strength — the debt section below matters here" : ""}`
        );
      s += bits.join("; ") + ".";
      p.push(s);
    }
    sections.push({ title: "Profitability — from margins to returns on capital", paragraphs: p });
  }

  // ---- 3. Earnings quality & cash generation ----
  {
    const p: string[] = [];
    if (cashConv !== null) {
      p.push(
        `Accounting profit only counts if it turns into cash. Operating cash flow of ${money(d.ocf, cur)} represents ${pct(cashConv, 0)} of reported net income — ` +
          (cashConv >= 1
            ? `cash generation actually runs ahead of the income statement, the framework's preferred sign of clean, conservative accounting.`
            : cashConv >= 0.8
              ? `close enough to earnings that accrual distortion looks limited.`
              : `a meaningful gap below reported earnings, which the framework flags as an earnings-quality warning: profits are being booked faster than cash is collected.`)
      );
    }
    if (d.fcf !== null && d.capex !== null && d.ocf !== null) {
      p.push(
        `After reinvesting ${money(d.capex, cur)} in capex (${pct(dv(d.capex, d.ocf), 0)} of operating cash flow), free cash flow comes to ${money(d.fcf, cur)} — a ${pct(fcfMargin)} FCF margin and a ${pct(fcfYield)} yield on the entire market value of the company. ` +
          (d.dividendsPaid !== null && d.dividendsPaid > 0
            ? `Dividends of ${money(d.dividendsPaid, cur)} are ${d.fcf > d.dividendsPaid ? `covered ${times(dv(d.fcf, d.dividendsPaid), 1)} over by that free cash flow, leaving ${money(d.fcf - d.dividendsPaid, cur)} for buybacks, debt paydown, or acquisitions` : `NOT fully covered by free cash flow — the payout is being financed from the balance sheet, which is unsustainable`}.`
            : `The company currently pays no meaningful dividend, so all of that cash is available for reinvestment, buybacks, or debt reduction.`)
      );
    }
    if (fcfGrowth && (fcfGrowth.cagr5 !== null || fcfGrowth.cagr3 !== null)) {
      const g = fcfGrowth.cagr5 ?? fcfGrowth.cagr3;
      p.push(
        `That cash engine has ${g !== null && g > 0 ? `compounded at ${pct(g)} annually over the medium term — the growth section below shows whether revenue supports its continuation` : `not grown over the medium term, which caps what the valuation can reasonably assume`}.`
      );
    }
    sections.push({ title: "Earnings quality — does profit become cash?", paragraphs: p });
  }

  // ---- 4. Balance sheet: leverage → coverage → resilience ----
  {
    const p: string[] = [];
    if (d.netDebt !== null) {
      const s =
        d.netDebt < 0
          ? `The balance sheet is a source of strength: cash exceeds total debt by ${money(Math.abs(d.netDebt), cur)}, a net-cash position that makes the liquidity and coverage ratios almost academic.`
          : `The company carries net debt of ${money(d.netDebt, cur)}${ndEbitda !== null ? `, which is ${times(ndEbitda, 1)} EBITDA — ${ndEbitda <= 1 ? "conservative" : ndEbitda <= 3 ? "manageable, within the normal corporate range" : "elevated; debt repayment capacity deserves close attention"}` : ""}.`;
      p.push(s);
    }
    if (de !== null || intCov !== null) {
      const bits: string[] = [];
      if (de !== null)
        bits.push(
          `debt-to-equity of ${times(de)} is ${de <= 1 ? "inside" : "outside"} the framework's preferred sub-1.0 zone`
        );
      if (intCov !== null)
        bits.push(
          `operating profit covers interest expense ${times(intCov, 1)} over (target: above 5x)${intCov < 5 ? " — a squeeze on EBIT would transmit quickly to the bottom line" : ""}`
        );
      else bits.push(`interest expense is negligible, so earnings carry essentially no financing drag`);
      if (currentRatio !== null)
        bits.push(`short-term obligations are covered ${times(currentRatio)} by current assets`);
      p.push(`Connecting leverage back to the income statement: ${bits.join("; ")}.`);
    }
    if (altman.z !== null) {
      p.push(
        `The Altman Z-Score wraps these threads (liquidity, retained profitability, operating return on assets, market solvency buffer, and asset turnover) into one number: ${altman.z.toFixed(2)}, ` +
          (altman.zone === "safe"
            ? `comfortably in the safe zone (above 2.99). Bankruptcy risk is not part of this story.`
            : altman.zone === "grey"
              ? `in the grey zone (1.81–2.99) — not distressed, but without the balance-sheet cushion of a fortress company.`
              : `in the distress zone (below 1.81) — the single most important red flag in this report.`)
      );
    }
    p.push(
      `The Piotroski F-Score, which checks year-over-year direction across profitability, leverage, and efficiency, reads ${piotroski.score}/9 — ${piotroski.score >= 7 ? "fundamentals are improving on a broad front" : piotroski.score >= 4 ? "a mixed picture: some trends improving, others deteriorating" : "most underlying trends moved the wrong way this year"}.`
    );
    sections.push({ title: "Balance sheet — leverage, coverage, and resilience", paragraphs: p });
  }

  // ---- 5. Growth trajectory ----
  {
    const p: string[] = [];
    if (revGrowth) {
      const bits: string[] = [];
      if (revGrowth.yoy !== null) bits.push(`${pct(revGrowth.yoy)} last year`);
      if (revGrowth.cagr3 !== null) bits.push(`${pct(revGrowth.cagr3)} annualized over 3 years`);
      if (revGrowth.cagr5 !== null) bits.push(`${pct(revGrowth.cagr5)} over 5`);
      if (revGrowth.cagr10 !== null) bits.push(`${pct(revGrowth.cagr10)} over 10`);
      if (bits.length) {
        const tw = trendWord(revGrowth);
        p.push(`Revenue has grown ${bits.join(", ")}${tw ? ` — ${tw} trajectory` : ""}.`);
      }
    }
    if (epsGrowth && revGrowth && epsGrowth.cagr5 !== null && revGrowth.cagr5 !== null) {
      const spread = epsGrowth.cagr5 - revGrowth.cagr5;
      p.push(
        spread > 0.02
          ? `EPS has compounded faster than revenue (${pct(epsGrowth.cagr5)} vs ${pct(revGrowth.cagr5)}), meaning growth is being amplified by margin expansion and/or share-count reduction — the healthiest kind of earnings growth, but also the kind that eventually exhausts its levers.`
          : spread < -0.02
            ? `EPS has lagged revenue growth (${pct(epsGrowth.cagr5)} vs ${pct(revGrowth.cagr5)}), meaning margins compressed or the share count grew — sales are climbing but less of each sale reaches shareholders.`
            : `EPS and revenue have compounded roughly in step, suggesting growth without material margin or dilution distortion.`
      );
    }
    if (p.length === 0) p.push(`Insufficient history to compute multi-year growth rates for this company.`);
    sections.push({ title: "Growth — durability of the trajectory", paragraphs: p });
  }

  // ---- 6. Valuation: connecting price to everything above ----
  {
    const p: string[] = [];
    if (pe !== null && pe > 0) {
      const g = epsGrowth?.cagr3 ?? epsGrowth?.cagr5 ?? null;
      let s = `The market prices all of the above at ${times(pe, 1)} earnings`;
      if (g !== null && g > 0) {
        const peg = pe / (g * 100);
        s += `, or a PEG of ${peg.toFixed(2)} against its EPS growth rate — ${peg <= 1 ? "growth is not yet fully paid for" : peg <= 2 ? "a full but not absurd price for the growth on offer" : "a price that assumes the growth continues well beyond what history alone would justify"}`;
      }
      s += `. Free cash flow tells the same story from a harder-to-manipulate angle: a ${pct(fcfYield)} FCF yield${fcfYield !== null ? (fcfYield >= 0.06 ? " — genuinely cheap for a business of this quality profile" : fcfYield >= 0.03 ? " — a fair, unremarkable price" : " — the market is paying up, so the quality and growth sections above have to keep delivering to justify it") : ""}.`;
      p.push(s);
    }
    if (dcfRes.fairValuePerShare !== null && dcfRes.marginOfSafety !== null) {
      p.push(
        `A ${dcfRes.years}-year DCF (base FCF ${money(dcfRes.baseFcf, cur)}, ${pct(dcfRes.growthRate, 0)} growth, ${pct(dcfRes.discountRate, 0)} discount rate, ${pct(dcfRes.terminalGrowth, 1)} terminal growth) puts intrinsic value near ${money(dcfRes.fairValuePerShare, cur)} per share against the current ${money(dcfRes.currentPrice, cur)} — a margin of safety of ${pct(dcfRes.marginOfSafety, 0)}. ` +
          (dcfRes.marginOfSafety >= 0.25
            ? `That clears the classic value-investing threshold: the price offers real downside protection even if the assumptions prove optimistic.`
            : dcfRes.marginOfSafety >= 0
              ? `Positive but thin — the price is roughly fair, and returns from here depend on the business performing, not on a re-rating.`
              : `The stock trades above modeled intrinsic value: buying here is a bet that growth beats these assumptions.`)
      );
    } else {
      p.push(`A reliable DCF could not be computed (free cash flow is negative or insufficient history) — valuation rests on the multiples above.`);
    }
    sections.push({ title: "Valuation — what the price asks you to believe", paragraphs: p });
  }

  // ---- 7. Verdict ----
  {
    const p: string[] = [];
    const flags: string[] = [];
    if (altman.zone === "distress") flags.push("Altman Z in the distress zone");
    if (cashConv !== null && cashConv < 0.8) flags.push("weak conversion of earnings into cash");
    if (intCov !== null && intCov < 5) flags.push("interest coverage below the 5x target");
    if (d.fcf !== null && d.fcf <= 0) flags.push("negative free cash flow");
    if (de !== null && de > 1) flags.push("leverage above the framework ceiling");

    p.push(
      `Bottom line: ${name} rates ${score.total}/100 (“${score.rating}”). ` +
        (flags.length
          ? `Before acting, resolve the open risks this report surfaced: ${flags.join("; ")}.`
          : `No disqualifying red flags surfaced across earnings quality, leverage, or solvency.`) +
        (dcfRes.marginOfSafety !== null
          ? dcfRes.marginOfSafety >= 0.25
            ? ` With a ${pct(dcfRes.marginOfSafety, 0)} margin of safety, the setup merits serious consideration.`
            : dcfRes.marginOfSafety >= 0
              ? ` At roughly fair value, this is a watch-list candidate: quality confirmed, price unremarkable.`
              : ` At current prices the market already assumes success — patience may be rewarded with a better entry.`
          : "")
    );
    p.push(
      `This report is generated from your analysis framework for research purposes and is not investment advice.`
    );
    sections.push({ title: "Verdict", paragraphs: p });
  }

  return sections;
}

function trendWord(g: GrowthRow): string | null {
  const recent = g.cagr3 ?? g.yoy;
  const longer = g.cagr10 ?? g.cagr5;
  if (recent === null || longer === null) return null;
  if (recent > longer + 0.02) return "an accelerating";
  if (recent < longer - 0.02) return "a decelerating";
  return "a steady";
}
