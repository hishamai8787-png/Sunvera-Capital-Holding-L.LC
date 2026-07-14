import Link from "next/link";
import { analyzeCompany } from "@/lib/analyze";
import { DataSourceError } from "@/lib/fmp";
import TradingViewChart from "@/components/TradingViewChart";
import {
  ScoreCard,
  QuickStats,
  RatioTable,
  GrowthTable,
  Narrative,
  NewsList,
} from "@/components/report";

export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  let report;
  try {
    report = await analyzeCompany(decodeURIComponent(symbol));
  } catch (err) {
    const message =
      err instanceof DataSourceError || err instanceof Error
        ? err.message
        : "Something went wrong.";
    return (
      <main className="flex items-center justify-center px-6 py-32">
        <div className="max-w-lg text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-semibold mb-3">
            Couldn&apos;t analyze {symbol.toUpperCase()}
          </h1>
          <p className="text-slate-400 mb-6">{message}</p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5"
          >
            Back to search
          </Link>
        </div>
      </main>
    );
  }

  const { profile, quote } = report;
  const chg = quote.changePercentage ?? 0;

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
              <h1 className="text-2xl sm:text-3xl font-semibold truncate">
                {profile.companyName}{" "}
                <span className="text-slate-500 text-lg sm:text-xl">({report.symbol})</span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5 truncate">
                {profile.exchange} · {profile.sector} · {profile.industry}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-3xl font-semibold tabular-nums">
                ${quote.price?.toFixed(2)}
              </div>
              <div
                className={`text-sm font-medium tabular-nums ${chg >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {chg >= 0 ? "▲" : "▼"} {chg >= 0 ? "+" : ""}
                {chg.toFixed(2)}% today
              </div>
            </div>
            <Link
              href={`/credit/${report.symbol}`}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 text-sm shadow-lg shadow-amber-500/20 transition-colors"
            >
              🏦 Credit proposal
            </Link>
          </div>
        </div>

        {/* Quick stats + score */}
        <QuickStats report={report} />

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <TradingViewChart symbol={report.symbol} />
            <Narrative report={report} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <ScoreCard report={report} />
            <GrowthTable growth={report.growth} />
            <NewsList report={report} />
          </div>
        </div>

        {/* Full ratio tables */}
        <h2 className="text-lg font-semibold text-slate-200 pt-2">
          Full Ratio Detail{" "}
          <span className="text-sm text-slate-500 font-normal">
            ({report.yearsOfData} years of statements)
          </span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {report.categories.map((c) => (
            <RatioTable key={c.key} category={c} />
          ))}
        </div>

        <p className="text-xs text-slate-600 pb-4">
          Generated {new Date(report.generatedAt).toLocaleString()} · {report.yearsOfData} years of
          statements analyzed.
        </p>
      </div>
    </main>
  );
}
