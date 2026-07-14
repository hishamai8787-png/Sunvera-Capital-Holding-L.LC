import { loadTrades } from "@/lib/trades";
import { buildPlaybook, type SegmentStats } from "@/lib/playbook";
import TradeImport from "@/components/TradeImport";

export const metadata = { title: "Playbooks — Sunvera Analyst" };
export const dynamic = "force-dynamic";

const pct = (v: number | null, d = 1) => (v === null ? "—" : `${(v * 100).toFixed(d)}%`);
const money = (v: number | null) => {
  if (v === null) return "—";
  const sign = v < 0 ? "-" : "+";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};
const pnlColor = (v: number | null) =>
  v === null ? "text-slate-500" : v >= 0 ? "text-emerald-400" : "text-red-400";

function SegmentCard({ s }: { s: SegmentStats }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold text-slate-100">{s.segment}</h3>
        <span className={`font-semibold tabular-nums ${pnlColor(s.totalPnl)}`}>
          {money(s.totalPnl)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 mb-3">
        <span>{s.closed} closed / {s.trades} total</span>
        <span>Hit rate <b className="text-slate-200">{pct(s.winRate, 0)}</b></span>
        <span>Avg <b className={pnlColor(s.avgReturn)}>{pct(s.avgReturn)}</b></span>
        {s.avgHoldingDays !== null && <span>~{Math.round(s.avgHoldingDays)} days held</span>}
      </div>
      <div className="space-y-1.5">
        {s.narrative.map((p, i) => (
          <p key={i} className="text-sm text-slate-300 leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function SegmentGroup({ title, segments }: { title: string; segments: SegmentStats[] }) {
  if (!segments.length) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-200 mb-3">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {segments.map((s) => (
          <SegmentCard key={s.segment} s={s} />
        ))}
      </div>
    </section>
  );
}

export default async function PlaybooksPage() {
  const trades = await loadTrades();
  const hasData = trades.length > 0;
  const pb = hasData ? buildPlaybook(trades) : null;

  return (
    <main className="text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/40 p-5 space-y-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-amber-400/80">Sunvera Capital</p>
            <h1 className="text-2xl font-semibold mt-0.5">Trade Playbooks</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Your historical trades, analyzed by sector, asset class, market, and year — so the
              next decision starts from &ldquo;here&rsquo;s what actually worked.&rdquo;
            </p>
          </div>
          <TradeImport hasData={hasData} />
        </div>

        {!hasData && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
            <div className="text-5xl mb-4">📒</div>
            <h2 className="text-lg font-semibold mb-2">No trade history yet</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Download the template, fill in your past trades (or export from your broker and match
              the column names), then import it — or load the sample data to see how playbooks
              look.
            </p>
          </div>
        )}

        {pb && (
          <>
            {/* Overall stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Closed Trades", value: String(pb.overall.closed), color: "text-slate-100" },
                { label: "Hit Rate", value: pct(pb.overall.winRate, 0), color: pb.overall.winRate !== null && pb.overall.winRate >= 0.5 ? "text-emerald-300" : "text-amber-300" },
                { label: "Avg Return / Trade", value: pct(pb.overall.avgReturn), color: pnlColor(pb.overall.avgReturn) },
                { label: "Median Return", value: pct(pb.overall.medianReturn), color: pnlColor(pb.overall.medianReturn) },
                { label: "Total P&L", value: money(pb.overall.totalPnl), color: pnlColor(pb.overall.totalPnl) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
                  <div className={`text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Overall narrative */}
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5 space-y-1.5">
              <h2 className="text-sm font-semibold text-amber-300 mb-1">The Book Overall</h2>
              {pb.overall.narrative.map((p, i) => (
                <p key={i} className="text-sm text-slate-200 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            <SegmentGroup title="By Sector" segments={pb.bySector} />
            <SegmentGroup title="By Asset Class" segments={pb.byAssetClass} />
            <SegmentGroup title="By Market" segments={pb.byMarket} />
            <SegmentGroup title="By Year" segments={pb.byYear} />

            {/* Full trade log */}
            <section>
              <h2 className="text-sm font-semibold text-slate-200 mb-3">
                Trade Log <span className="text-slate-500 font-normal">({trades.length})</span>
              </h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900">
                        <th className="px-4 py-2.5 text-left font-medium">Opened</th>
                        <th className="px-3 py-2.5 text-left font-medium">Closed</th>
                        <th className="px-3 py-2.5 text-left font-medium">Instrument</th>
                        <th className="px-3 py-2.5 text-left font-medium">Class</th>
                        <th className="px-3 py-2.5 text-left font-medium">Sector</th>
                        <th className="px-3 py-2.5 text-left font-medium">Mkt</th>
                        <th className="px-3 py-2.5 text-left font-medium">Dir</th>
                        <th className="px-3 py-2.5 text-right font-medium">Return</th>
                        <th className="px-4 py-2.5 text-right font-medium">P&amp;L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...trades]
                        .sort((a, b) => b.dateOpened.localeCompare(a.dateOpened))
                        .map((t) => (
                          <tr key={t.id} className="border-t border-slate-800/60">
                            <td className="px-4 py-2 text-slate-400 whitespace-nowrap">{t.dateOpened}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                              {t.dateClosed ?? <span className="text-amber-400/80">open</span>}
                            </td>
                            <td className="px-3 py-2 text-slate-200">
                              <span className="font-medium">{t.symbol}</span>
                              <span className="text-slate-500 text-xs ml-1.5 hidden lg:inline">{t.name}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-400">{t.assetClass}</td>
                            <td className="px-3 py-2 text-slate-400">{t.sector}</td>
                            <td className="px-3 py-2 text-slate-400">{t.market}</td>
                            <td className="px-3 py-2 text-slate-400">{t.direction}</td>
                            <td className={`px-3 py-2 text-right tabular-nums ${pnlColor(t.pnlPct)}`}>
                              {t.pnlPct !== null ? `${t.pnlPct >= 0 ? "+" : ""}${(t.pnlPct * 100).toFixed(1)}%` : "—"}
                            </td>
                            <td className={`px-4 py-2 text-right tabular-nums ${pnlColor(t.pnl)}`}>
                              {money(t.pnl)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
