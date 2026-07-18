import Link from "next/link";
import { buildCreditReport } from "@/lib/creditReport";
import { DataSourceError } from "@/lib/fmp";
import type { FacilityInput } from "@/lib/credit";
import { money } from "@/lib/ratios";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  const sym = decodeURIComponent(symbol).toUpperCase();
  return {
    title: `${sym} — Credit Proposal`,
    description: `Bank-grade credit assessment for ${sym}: DSCR, leverage, pro-forma facility impact, peer benchmarks, risk rating, and Word document export for committee.`,
    alternates: { canonical: `https://sunveracapital.com/credit/${sym}` },
  };
}

const assessColor: Record<string, string> = {
  strong: "text-emerald-300",
  acceptable: "text-emerald-500",
  watch: "text-[#e0c887]",
  weak: "text-red-400",
  na: "text-slate-400",
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
      err instanceof DataSourceError || err instanceof Error ? "An error occurred while building the credit proposal." : "Failed.";
    return (
      <main className="min-h-screen bg-[#0a0e1a] text-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg text-center" role="alert">
          <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
          <h1 className="text-2xl font-semibold mb-3">
            Couldn&apos;t build a proposal for {symbol.toUpperCase()}
          </h1>
          <p className="text-slate-400 mb-6">{message}</p>
          <Link href="/" className="inline-block rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-6 py-2.5 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const { assessment, narrative, peers, profile } = report;
  const cur = report.currency;
  const g = assessment.rating.grade;
  const gradeColor = g <= 3 ? "text-emerald-300" : g <= 5 ? "text-[#e0c887]" : "text-red-400";
  const docxUrl = `/api/credit/${report.symbol}/docx?${new URLSearchParams(
    Object.fromEntries(Object.entries(sp).filter(([, v]) => v)) as Record<string, string>
  ).toString()}`;

  return (
    <main className="text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="card-surface bg-gradient-to-r from-slate-900 to-slate-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {profile.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.image}
                  alt={`${profile.companyName} logo`}
                  className="w-14 h-14 rounded-xl bg-white/90 p-1.5 object-contain shrink-0"
                />
              )}
              <div className="min-w-0">
                <Link
                  href={`/analyze/${report.symbol}`}
                  className="text-xs text-slate-400 hover:text-[#e0c887]"
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
                <div className="text-xs uppercase tracking-wider text-slate-400">Internal Rating</div>
                <div className={`text-3xl font-bold ${gradeColor}`}>{g}/10</div>
                <div className={`text-sm ${gradeColor}`}>{assessment.rating.label}</div>
              </div>
              <a
                href={docxUrl}
                className="rounded-xl bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-4 py-2.5 text-sm shadow-lg shadow-[#c5a35e]/10 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">⬇</span> Word (.docx)
              </a>
            </div>
          </div>
        </div>

        {/* Facility form */}
        <form
          method="get"
          className="card-surface p-5"
          aria-label="Facility parameters"
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-3">
            <span aria-hidden="true">💼</span> Facility parameters{" "}
            <span className="text-xs font-normal text-slate-400">
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
                className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-1 focus-visible:outline-[#c5a35e]"
              />
            </label>
          ))}
          <label className="text-xs text-slate-400">
            Type
            <select
              name="type"
              defaultValue={sp.type || "Term Loan"}
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-[#c5a35e]"
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
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-[#c5a35e]"
            />
          </label>
          <label className="text-xs text-slate-400 col-span-2 md:col-span-1">
            Peers (comma-sep, blank = auto)
            <input
              name="peers"
              defaultValue={sp.peers || ""}
              placeholder="auto"
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-[#c5a35e]"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-4 py-2 text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
          >
            Recalculate
          </button>
          <input type="hidden" name="purpose" value={sp.purpose || ""} />
          </div>
        </form>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Narrative */}
          <div className="lg:col-span-3 card-surface p-6 space-y-5">
            {narrative.map((sec) => (
              <section key={sec.title}>
                <h3 className="text-[#e0c887] font-medium mb-2">{sec.title}</h3>
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
            <div className="card-surface overflow-hidden">
              <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                Credit Metrics
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  {assessment.metrics.map((mt) => (
                    <tr key={mt.key} className="border-b border-slate-800/60 last:border-0">
                      <td className="px-5 py-2.5 text-slate-300">
                        {mt.label}
                        <span className="block text-xs text-slate-400">{mt.benchmark}</span>
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
              <div className="card-surface overflow-hidden">
                <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                  Pro-Forma (facility fully drawn)
                </h3>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { l: "Net Debt / EBITDA", b: fx(assessment.proForma.netDebtEbitda.before), a: fx(assessment.proForma.netDebtEbitda.after) },
                      { l: "Interest Coverage", b: fx(assessment.proForma.interestCoverage.before), a: fx(assessment.proForma.interestCoverage.after) },
                      { l: "DSCR (Pro Forma)", b: "—", a: fx(assessment.proForma.dscrProForma) },
                    ].map((row) => (
                      <tr key={row.l} className="border-b border-slate-800/60 last:border-0">
                        <td className="px-5 py-2.5 text-slate-300">{row.l}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-400">{row.b}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums font-medium text-slate-200">→ {row.a}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Peer comparison */}
            {peers && peers.peers.length > 0 && (
              <div className="card-surface overflow-hidden">
                <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
                  Peer Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-400">
                        <th scope="col" className="px-5 py-2 text-left font-medium">Company</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">ND/EBITDA</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">Int. Cov.</th>
                        <th scope="col" className="px-5 py-2 text-right font-medium">EBITDA Mgn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peers.peers.map((p) => (
                        <tr key={p.symbol} className="border-b border-slate-800/60 last:border-0">
                          <td className="px-5 py-2 text-slate-200">
                            <Link href={`/credit/${p.symbol}`} className="font-medium hover:text-[#e0c887]">{p.symbol}</Link>
                            <span className="text-xs text-slate-400 ml-1.5 hidden lg:inline">{p.companyName ?? ""}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">{fx(p.netDebtEbitda)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-300">{fx(p.interestCoverage)}</td>
                          <td className="px-5 py-2 text-right tabular-nums text-slate-300">
                            {p.ebitdaMargin != null ? `${(p.ebitdaMargin * 100).toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary table */}
        <div className="card-surface overflow-hidden">
          <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
            Financial Summary ({cur})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400">
                  <th scope="col" className="px-5 py-2 text-left font-medium">Metric</th>
                  {assessment.trend.map((t) => (
                    <th key={t.year} scope="col" className="px-3 py-2 text-right font-medium">{t.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Revenue", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.revenue },
                  { label: "EBITDA", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.ebitda },
                  { label: "Net Debt / EBITDA", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.netDebtEbitda },
                  { label: "Interest Coverage", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.interestCoverage },
                  { label: "Operating Cash Flow", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.ocf },
                  { label: "Free Cash Flow", get: (t: { revenue?: number | null; ebitda?: number | null; netDebtEbitda?: number | null; interestCoverage?: number | null; ocf?: number | null; fcf?: number | null }) => t.fcf },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-slate-800/60">
                    <td className="px-5 py-2 text-slate-300">{row.label}</td>
                    {assessment.trend.map((t, i) => (
                      <td key={i} className="px-3 py-2 text-right tabular-nums text-slate-200">{row.get(t) != null ? fx(row.get(t) as number, 1) : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-400 pb-4">
          Generated {new Date(report.generatedAt).toLocaleString()} · Internal use only · Not investment advice.
        </p>
      </div>
    </main>
  );
}
