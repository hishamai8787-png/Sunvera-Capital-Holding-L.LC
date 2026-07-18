import Link from "next/link";
import { SITE_URL } from "@/lib/siteConfig";
import { loadLastScan } from "@/lib/scanner";
import ScanRunner from "@/components/ScanRunner";
import ScannerResults from "@/components/ScannerResults";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunity Scanner",
  description:
    "Run the full Sunvera Capital framework over the investable universe. Flags names worth a closer look with reasons — not just rankings.",
  alternates: { canonical: `${SITE_URL}/scanner` },
};

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const scan = await loadLastScan();
  const flagged = scan?.opportunities.filter((o) => o.flagged) ?? [];
  const rest = scan?.opportunities.filter((o) => !o.flagged) ?? [];

  return (
    <main className="text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="card-surface bg-gradient-to-r from-slate-900 to-slate-900/40 p-5 space-y-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e]">Sunvera Capital</p>
            <h1 className="text-2xl font-semibold mt-0.5">Opportunity Scanner</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Runs the full framework over the investable universe and flags names worth a closer
              look — with the reasons, not just the ranking. Coverage follows your data plan (US
              large caps on the free tier).
            </p>
          </div>
          <ScanRunner lastRun={scan?.generatedAt ?? null} />
        </div>

        {!scan && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
            <div className="text-5xl mb-4" aria-hidden="true">🔎</div>
            <h2 className="text-lg font-semibold mb-2">No scan yet</h2>
            <p className="text-sm text-slate-400">
              Hit &ldquo;Run scan&rdquo; to analyze the universe. Results are saved, so the latest
              scan is always here when you come back.
            </p>
          </div>
        )}

        {scan && (
          <>
            {flagged.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-200 mb-3">
                  <span aria-hidden="true">🚩</span> Flagged for investigation ({flagged.length})
                </h2>
                <div className="space-y-3">
                  {flagged.map((o) => (
                    <div
                      key={o.symbol}
                      className="rounded-xl border border-[#c5a35e]/25 bg-[#c5a35e]/5 p-5 hover:shadow-md hover:shadow-[#c5a35e]/5 transition-shadow"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <Link
                            href={`/analyze/${o.symbol}`}
                            aria-label={`Analyze ${o.companyName} (${o.symbol})`}
                            className="font-semibold text-slate-100 hover:text-[#e0c887] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
                          >
                            {o.companyName}{" "}
                            <span className="text-slate-400 font-normal">({o.symbol})</span>
                          </Link>
                          <span className="text-xs text-slate-400 ml-2">{o.sector}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="tabular-nums text-slate-300">${o.price.toFixed(2)}</span>
                          <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-[#c5a35e]/15 text-[#e0c887]">
                            OPPORTUNITY {o.opportunityScore}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-2">{o.brief}</p>
                      <div className="flex gap-3 text-xs">
                        <Link href={`/analyze/${o.symbol}`} className="text-[#c5a35e] hover:text-[#e0c887] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
                          Full analysis →
                        </Link>
                        <Link href={`/credit/${o.symbol}`} className="text-slate-400 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
                          Credit view →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <ScannerResults
              opportunities={[...flagged, ...rest]}
              unavailable={scan.unavailable}
            />
          </>
        )}
      </div>
    </main>
  );
}
