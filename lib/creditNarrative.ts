// Credit proposal narrative — writes the proposal the way a credit analyst
// would: business risk first, then financial risk with leverage, coverage and
// liquidity linked together, repayment capacity, peer positioning, and a
// recommendation that follows from the evidence.

import type { CompanyData } from "./types";
import type { Derived } from "./ratios";
import { money, pct, times } from "./ratios";
import type { CreditAssessment, FacilityInput } from "./credit";
import type { PeerComparison } from "./peers";

export interface CreditSection {
  title: string;
  paragraphs: string[];
}

const fx = (v: number | null, d = 1) => (v === null ? "—" : `${v.toFixed(d)}x`);

export function buildCreditNarrative(
  data: CompanyData,
  d: Derived,
  credit: CreditAssessment,
  peersCmp: PeerComparison | null,
  facility: FacilityInput | null
): CreditSection[] {
  const name = data.profile.companyName || data.profile.symbol;
  const cur = d.currency;
  const sections: CreditSection[] = [];
  const pick = (key: string) => credit.metrics.find((m) => m.key === key)!;

  // ---- 1. Borrower & purpose ----
  {
    const p: string[] = [];
    p.push(
      `${name} (${data.profile.symbol}) is a ${data.profile.industry || data.profile.sector} company listed on the ${data.profile.exchange}, with reported revenue of ${money(d.revenue, cur)} and a market capitalization of ${money(d.marketCap, cur)}. ` +
        `Internal risk rating: ${credit.rating.grade}/10 (${credit.rating.label}).`
    );
    if (facility && facility.amount > 0) {
      p.push(
        `Proposed facility: ${facility.type} of ${money(facility.amount, cur)} for ${facility.tenorYears} year${facility.tenorYears === 1 ? "" : "s"} at an assumed ${pct(facility.rate, 2)} per annum, ${facility.security.toLowerCase() === "unsecured" ? "on an unsecured basis" : `secured by ${facility.security}`}. Purpose: ${facility.purpose || "general corporate purposes"}. Estimated annual debt service (straight-line principal plus interest) is ${money(credit.proForma?.annualDebtService ?? null, cur)}.`
      );
    }
    sections.push({ title: "Borrower & Requested Facility", paragraphs: p });
  }

  // ---- 2. Business risk ----
  {
    const p: string[] = [];
    const t = credit.trend;
    const first = t[t.length - 1];
    const last = t[0];
    const revTrend =
      first?.revenue && last?.revenue
        ? last.revenue > first.revenue * 1.05
          ? "has grown"
          : last.revenue < first.revenue * 0.95
            ? "has contracted"
            : "has been broadly flat"
        : null;
    p.push(
      `${name} operates in the ${data.profile.industry || data.profile.sector} industry. Over the ${t.length}-year period on record, revenue ${revTrend ?? "history is limited"}${first?.revenue && last?.revenue ? ` from ${money(first.revenue, cur)} to ${money(last.revenue, cur)}` : ""}, and EBITDA of ${money(last?.ebitda ?? null, cur)} in the latest year sets the cash-generation baseline every ratio below rests on. ` +
        `The durability of that EBITDA — not its level — is what carries the credit through the tenor.`
    );
    if (data.profile.description) {
      p.push(data.profile.description.split(". ").slice(0, 2).join(". ") + ".");
    }
    sections.push({ title: "Business Risk", paragraphs: p });
  }

  // ---- 3. Financial risk: leverage → coverage → liquidity ----
  {
    const p: string[] = [];
    const nd = pick("ndEbitda");
    const ic = pick("intCov");
    const dscr = pick("dscr");
    const cr = pick("currentRatio");
    const alt = pick("altman");

    p.push(
      `Leverage stands at ${nd.display} net debt to EBITDA (${nd.assessment === "strong" ? "conservative" : nd.assessment === "acceptable" ? "within normal corporate bounds" : nd.assessment === "watch" ? "elevated" : "aggressive"} against the ${nd.benchmark} benchmark)${d.netDebt !== null && d.netDebt < 0 ? " — in fact the company holds more cash than debt, so leverage risk is nominal" : ""}. ` +
        (ic.value === null
          ? `Interest expense is negligible relative to operating profit, so earnings carry essentially no financing drag.`
          : `That leverage translates into the income statement as interest cover of ${ic.display}: ${ic.assessment === "strong" ? "earnings would have to collapse before debt service is threatened" : ic.assessment === "acceptable" ? "adequate headroom, though a severe downturn would compress it quickly" : "thin cover — the buffer between operating profit and the interest bill is a genuine vulnerability"}.`)
    );
    p.push(
      `On a cash basis, operating cash flow covers estimated existing debt service (interest plus current maturities) ${dscr.display}${dscr.value !== null ? ` — ${dscr.assessment === "strong" ? "comfortably above" : dscr.assessment === "acceptable" ? "above" : "below"} the 1.25x floor most credit policies require` : ""}. ` +
        `Liquidity backstops the picture: current ratio of ${cr.display} and quick ratio of ${pick("quickRatio").display}${cr.assessment === "weak" || cr.assessment === "watch" ? " — working capital is tight, so undrawn headroom or a revolver matters here" : ""}. ` +
        `The Altman Z-Score of ${alt.display} places the obligor in the ${alt.assessment === "strong" ? "safe" : alt.assessment === "watch" ? "grey" : alt.assessment === "weak" ? "distress" : "unrated"} zone.`
    );
    sections.push({ title: "Financial Risk — Leverage, Coverage, Liquidity", paragraphs: p });
  }

  // ---- 4. Repayment capacity ----
  {
    const p: string[] = [];
    const payback = pick("debtFcf");
    p.push(
      `The primary source of repayment is operating cash flow of ${money(d.ocf, cur)}, which after capex of ${money(d.capex, cur)} leaves free cash flow of ${money(d.fcf, cur)} (${pct(d.fcf !== null && d.revenue ? d.fcf / d.revenue : null)} of revenue). ` +
        (payback.value !== null
          ? `At that run-rate, existing total debt of ${money(d.totalDebt, cur)} could be repaid from free cash flow in roughly ${payback.display} — ${payback.assessment === "strong" ? "a fast deleveraging profile" : payback.assessment === "acceptable" ? "a reasonable horizon" : "a long horizon that leans on refinancing rather than amortization"}.`
          : `Free cash flow is currently insufficient to state a meaningful debt payback period — repayment would depend on refinancing or asset support.`)
    );
    if (credit.proForma && facility) {
      const pf = credit.proForma;
      p.push(
        `Pro-forma for the requested ${money(facility.amount, cur)} facility (fully drawn): net leverage moves from ${fx(pf.netDebtEbitda.before)} to ${fx(pf.netDebtEbitda.after)} EBITDA, interest cover from ${fx(pf.interestCoverage.before)} to ${fx(pf.interestCoverage.after)}, and debt-to-equity from ${fx(pf.debtToEquity.before, 2)} to ${fx(pf.debtToEquity.after, 2)}. ` +
          `Cash DSCR including the new facility's debt service is ${fx(pf.dscrProForma, 2)} — ${pf.dscrProForma !== null && pf.dscrProForma >= 1.25 ? "the facility is serviceable from operating cash flow with margin to spare" : pf.dscrProForma !== null && pf.dscrProForma >= 1 ? "serviceable but with limited cushion; covenant protection is advised" : "NOT fully serviceable from current operating cash flow — approval would rely on growth, asset sales, or refinancing assumptions"}.`
      );
    }
    sections.push({ title: "Repayment Capacity", paragraphs: p });
  }

  // ---- 5. Peer positioning ----
  if (peersCmp && peersCmp.peers.some((pr) => !pr.failed)) {
    const p: string[] = [];
    const s = peersCmp.subject;
    const m = peersCmp.median;
    // three-way comparison with a 5% relative tolerance so equal values read as "in line"
    const rel = (a: number | null, b: number | null): "better" | "worse" | "inline" | null => {
      if (a === null || b === null) return null;
      const tol = Math.max(Math.abs(b) * 0.05, 1e-9);
      return a > b + tol ? "better" : a < b - tol ? "worse" : "inline";
    };

    const points: string[] = [];
    const lev = rel(s.netDebtEbitda, m.netDebtEbitda);
    if (lev !== null)
      points.push(
        `leverage of ${fx(s.netDebtEbitda)} vs a peer median of ${fx(m.netDebtEbitda)} (${lev === "inline" ? "in line with" : lev === "worse" ? "less levered than" : "more levered than"} the group)`
      );
    const marg = rel(s.ebitdaMargin, m.ebitdaMargin);
    if (marg !== null)
      points.push(
        `EBITDA margin of ${pct(s.ebitdaMargin)} vs ${pct(m.ebitdaMargin)} median (${marg === "inline" ? "in line with" : marg === "better" ? "above" : "below"} the group)`
      );
    const grow = rel(s.revenueGrowth3y, m.revenueGrowth3y);
    if (grow !== null)
      points.push(
        `3-year revenue growth of ${pct(s.revenueGrowth3y)} vs ${pct(m.revenueGrowth3y)} (${grow === "inline" ? "matching" : grow === "better" ? "outgrowing" : "lagging"} peers)`
      );
    p.push(
      `Against ${peersCmp.peers.filter((pr) => !pr.failed).map((pr) => pr.symbol).join(", ")}, the borrower shows ${points.join("; ")}.`
    );
    const cov = rel(s.interestCoverage, m.interestCoverage);
    p.push(
      `Interest coverage ${cov !== null ? `of ${fx(s.interestCoverage)} versus the ${fx(m.interestCoverage)} median ${cov === "worse" ? "weakens" : cov === "inline" ? "is in line with" : "strengthens"} the relative credit story` : "comparison is limited by data availability"}. ` +
        `Peer context matters because industry-standard leverage and margins define what "normal" risk looks like for this sector — the absolute benchmarks above should be read with this relative position in mind.`
    );
    sections.push({ title: "Peer & Industry Positioning", paragraphs: p });
  }

  // ---- 6. Strengths, risks & mitigants ----
  {
    const strengths: string[] = [];
    const risks: string[] = [];
    for (const mt of credit.metrics) {
      if (mt.assessment === "strong") strengths.push(`${mt.label} at ${mt.display}`);
      if (mt.assessment === "weak" || mt.assessment === "watch")
        risks.push(`${mt.label} at ${mt.display} (benchmark: ${mt.benchmark})`);
    }
    const p: string[] = [];
    if (strengths.length)
      p.push(`Key strengths: ${strengths.slice(0, 5).join("; ")}.`);
    if (risks.length)
      p.push(
        `Key risks requiring mitigation: ${risks.slice(0, 5).join("; ")}. Standard mitigants to consider: financial covenants (maximum net leverage, minimum interest cover or DSCR), security or guarantees, and periodic financial reporting undertakings.`
      );
    else p.push(`No metric fell below acceptable thresholds in this assessment.`);
    sections.push({ title: "Strengths, Risks & Mitigants", paragraphs: p });
  }

  // ---- 7. Recommendation ----
  {
    const g = credit.rating.grade;
    const pf = credit.proForma;
    const serviceable = pf?.dscrProForma == null || pf.dscrProForma >= 1.25;
    const rec =
      g <= 3 && serviceable
        ? "APPROVE — the credit profile supports the requested facility on standard terms."
        : g <= 5 && serviceable
          ? "APPROVE WITH CONDITIONS — recommend covenant protection (net leverage ceiling, minimum coverage) and annual review."
          : g <= 7
            ? "REFER / CONDITIONAL — approvable only with strong security, tighter structure, or a reduced amount; escalate to committee."
            : "DECLINE as proposed — the risk profile does not support new unsecured exposure at this time.";
    sections.push({
      title: "Recommendation",
      paragraphs: [
        `Internal rating ${g}/10 (${credit.rating.label}). ${rec}`,
        `This proposal is generated from the Sunvera analysis framework for research and internal credit-assessment purposes. It is not a commitment to lend and not investment advice.`,
      ],
    });
  }

  return sections;
}
