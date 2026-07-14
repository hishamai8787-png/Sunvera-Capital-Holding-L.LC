import Link from "next/link";
import { buildCreditReport } from "@/lib/creditReport";
import { DataSourceError } from "@/lib/fmp";
import type { FacilityInput } from "@/lib/credit";
import { money } from "@/lib/ratios";

export const dynamic = "force-dynamic";

const assessColor: Record<string, string> = {
  strong: "text-emerald-300",
  acceptable: "text-emerald-500",
  watch: "text-amber-400",
  weak: "text-red-400",
  na: "text-slate-500",
};

const fx = (v: number | null, d = 1) => (v === null ? "—" : `${v.toFixed(d)}x`);
const fp = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

function parseFacility(sp: Record<string, string | undefined>): FacilityInput | null {
  const amount = Number(sp.amount || 0);
  if (!amount || amount <= 0) return null;
  return {
    amount,
    tenorYears: Math.max(1, Number(sp.tenor || 5)),
    rate: Math.max(0, Number(sp.rate || 6)) / 100,
    type: sp.type || "Term Loan",
    purpose: sp.purpose || "",
    security: sp.security || "Unsecured",
  };
}

export default async function CreditPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { symbol } = await params;
  const sp = await searchParams;
  const facility = parseFacility(sp);
  const peerList = (sp.peers || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let report;
  try {
    report = await buildCreditReport(decodeURIComponent(symbol), facility, peerList);
  } catch (err) {
    const message =
      err instanceof DataSourceError || err instanceof Error ? err.message : "Failed.";
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-2xl font-semibold mb-3">
            Couldn&apos;t build a proposal for {symbol.toUpperCase()}
          </h1>
          <p className="text-slate-400 mb-6">{message}</p>
          <Link href="/" className="inline-block rounded-lg bg-amber-500 text-slate-950 font-semibold px-6 py-2.5">
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const { assessment, narrative, peers, profile } = report;
  const cur = report.currency;
  const g = assessment.rating.grade;
  const gradeColor = g <= 3 ? "text-emerald-300" : g <= 5 ? "text-amber-300" : "text-red-400";
  const docxUrl = `/api/credit/${report.symbol}/docx?${new URLSearchParams(
    Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>
  ).toString()}`;

  return (
    <main className="text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/40 p-5">
          <div className="flex items-center gap-4 min-w-0">
            {profile.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt=""
                className="w-14 h-14 rounded-xl bg-white/90 p-1.5 object-contain shrink-0"
              />
            )}
            <div className="min-w-0">
              <Link
                href={`/analyze/${report.symbol}`}
                className="text-xs text-slate-500 hover:text-amber-300"
              >
                ← Equity analysis
              </Link>
              <h1 className="text-2xl sm:text-3xl font-semibold truncate">
                Credit Proposal <span className="text-slate-500">·</span> {profile.companyName}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 truncate">
                {profile.exchange} · {profile.sector} · {profile.industry} · Generated{" "}
                {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-500">Internal Rating</div>
              <div className={`text-3xl font-bold ${gradeColor}`}>{g}/10</div>
              <div className={`text-sm ${gradeColor}`}>{assessment.rating.label}</div>
            </div>
            <a
              href={docxUrl}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 text-sm shadow-lg shadow-amber-500/20 transition-colors"
            >
              ⬇ Word (.docx)
            </a>
          </div>
        </div>

        {/* Facility form */}
        <form
          method="get"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-3">
            💼 Facility parameters{" "}
            <span className="text-xs font-normal text-slate-500">
              — set the terms, then Recalculate to see the pro-forma impact
            </span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          {[
            { name: "amount", label: `Amount (${cur})`, placeholder: "e.g. 500000000", def: sp.amount },
            { name: "tenor", label: "Tenor (years)", placeholder: "5", def: sp.tenor },
            { name: "rate", label: "Rate (%)", placeholder: "6.5", def: sp.rate },
          ].map((f) => (
            <label key={f.name} className="text-xs text-slate-400">
              {f.label}
              <input
                name={f.name}
                defaultValue={f.def || ""}
                placeholder={f.placeholder}
                className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
              />
            </label>
          ))}
          <label className="text-xs text-slate-400">
            Type
            <select
              name="type"
              defaultValue={sp.type || "Term Loan"}
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
            >
              {["Term Loan", "Revolving Credit", "Bridge Loan", "Trade Finance", "Bond / Note"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Security
            <input
              name="security"
              defaultValue={sp.security || "Unsecured"}
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 col-span-2 md:col-span-1">
            Peers (comma-sep, blank = auto)
            <input
              name="peers"
              defaultValue={sp.peers || ""}
              placeholder="auto"
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 text-sm transition-colors"
          >
            Recalculate
          </button>
          <input type="hidden" name="purpose" value={sp.purpose || ""} />
          </div>
        </form>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Narrative */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
            {narrative.map((sec) => (
              <section key={sec.title}>
                <h3 className="text-amber-300/90 font-medium mb-2">{sec.title}</h3>
                {sec.paragraphs.map((p, i) => (
                  <p key={i} className="text-slate-300 leading-relaxed mb-2 last:mb-0">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Credit metrics */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                Credit Metrics
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {assessment.metrics.map((mt) => (
                    <tr key={mt.key} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-5 py-2.5 text-slate-300">
                        {mt.label}
                        <span className="block text-xs text-slate-500">{mt.benchmark}</span>
                      </td>
                      <td className={`px-5 py-2.5 text-right font-medium tabular-nums ${assessColor[mt.assessment]}`}>
                        {mt.display}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pro-forma */}
            {assessment.proForma && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                  Pro-Forma (facility fully drawn)
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { l: "Net Debt / EBITDA", b: fx(assessment.proForma.netDebtEbitda.before), a: fx(assessment.proForma.netDebtEbitda.after) },
                      { l: "Interest Coverage", b: fx(assessment.proForma.interestCoverage.before), a: fx(assessment.proForma.interestCoverage.after) },
                      { l: "Debt / Equity", b: fx(assessment.proForma.debtToEquity.before, 2), a: fx(assessment.proForma.debtToEquity.after, 2) },
                      { l: "Annual Debt Service", b: "—", a: money(assessment.proForma.annualDebtService, cur) },
                      { l: "Pro-forma Cash DSCR", b: "—", a: fx(assessment.proForma.dscrProForma, 2) },
                    ].map((r) => (
                      <tr key={r.l} className="border-b border-slate-800/60 last:border-0">
                        <td className="px-5 py-2.5 text-slate-300">{r.l}</td>
                        <td className="px-3 py-2.5 text-right text-slate-500 tabular-nums">{r.b}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-slate-100 tabular-nums">{r.a}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Rating factors */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                Rating Factors
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {assessment.rating.factors.map((f) => (
                    <tr key={f.factor} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-5 py-2.5 text-slate-300">
                        {f.factor}
                        <span className="block text-xs text-slate-500">{f.comment}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-400">{Math.round(f.weight * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Peer availability note */}
        {peers && peers.peers.some((p) => p.failed) && (
          <p className="text-xs text-amber-400/80">
            Peer data unavailable on the current FMP plan for:{" "}
            {peers.peers.filter((p) => p.failed).map((p) => p.symbol).join(", ")}. The free tier
            covers major large-caps only — try peers like MSFT, GOOGL, KO, JNJ, or upgrade the FMP
            plan for full coverage.
          </p>
        )}

        {/* Peer table */}
        {peers && peers.peers.some((p) => !p.failed) && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
              Peer Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-2 text-left font-medium">Company</th>
                    <th className="px-3 py-2 text-right font-medium">Revenue</th>
                    <th className="px-3 py-2 text-right font-medium">EBITDA Mgn</th>
                    <th className="px-3 py-2 text-right font-medium">Net Mgn</th>
                    <th className="px-3 py-2 text-right font-medium">ROE</th>
                    <th className="px-3 py-2 text-right font-medium">ND/EBITDA</th>
                    <th className="px-3 py-2 text-right font-medium">Int. Cover</th>
                    <th className="px-3 py-2 text-right font-medium">D/E</th>
                    <th className="px-3 py-2 text-right font-medium">Curr. Ratio</th>
                    <th className="px-3 py-2 text-right font-medium">FCF Mgn</th>
                    <th className="px-5 py-2 text-right font-medium">Rev 3y</th>
                  </tr>
                </thead>
                <tbody>
                  {[{ ...peers.subject, companyName: `${profile.companyName} ★` }, ...peers.peers.filter((p) => !p.failed), { symbol: "MEDIAN", companyName: "Peer median", ...peers.median }].map(
                    (p, idx) => (
                      <tr
                        key={p.symbol + idx}
                        className={`border-t border-slate-800/60 ${idx === 0 ? "bg-amber-500/5" : p.symbol === "MEDIAN" ? "bg-slate-800/40 font-medium" : ""}`}
                      >
                        <td className="px-5 py-2.5 text-slate-200">
                          {p.symbol === "MEDIAN" ? "Peer median" : `${p.companyName ?? p.symbol} (${p.symbol})`}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{money(p.revenue, cur)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fp(p.ebitdaMargin)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fp(p.netMargin)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fp(p.roe)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(p.netDebtEbitda)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(p.interestCoverage)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(p.debtToEquity, 2)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(p.currentRatio, 2)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fp(p.fcfMargin)}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-slate-300">{fp(p.revenueGrowth3y)}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
            Multi-Year Credit Trend
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-2 text-left font-medium">FY</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium">EBITDA</th>
                  <th className="px-3 py-2 text-right font-medium">ND/EBITDA</th>
                  <th className="px-3 py-2 text-right font-medium">Int. Cover</th>
                  <th className="px-3 py-2 text-right font-medium">OCF</th>
                  <th className="px-5 py-2 text-right font-medium">FCF</th>
                </tr>
              </thead>
              <tbody>
                {assessment.trend.map((t) => (
                  <tr key={t.year} className="border-t border-slate-800/60">
                    <td className="px-5 py-2.5 text-slate-200">{t.year}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{money(t.revenue, cur)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{money(t.ebitda, cur)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(t.netDebtEbitda)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{fx(t.interestCoverage)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{money(t.ocf, cur)}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-slate-300">{money(t.fcf, cur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-600 pb-8">
          Sunvera Analyst credit module · Data: Financial Modeling Prep · Internal use — not a commitment to lend, not investment advice.
        </p>
      </div>
    </main>
  );
}
