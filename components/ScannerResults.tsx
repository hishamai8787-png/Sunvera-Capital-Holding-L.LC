"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Pagination from "@/components/Pagination";

interface Opportunity {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  score: number;
  flagged: boolean;
  opportunityScore: number;
  signals: string[];
  risks: string[];
  brief: string;
}

const PAGE_SIZE = 15;

export default function ScannerResults({ opportunities, unavailable }: { opportunities: Opportunity[]; unavailable: string[] }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(opportunities.length / PAGE_SIZE);

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return opportunities.slice(start, start + PAGE_SIZE);
  }, [opportunities, page]);

  return (
    <>
      <section>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">
          Full universe ({opportunities.length} scanned)
        </h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Scanner results: {opportunities.length} companies analyzed with score, opportunity rating, and signals
              </caption>
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-900">
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th scope="col" className="px-3 py-2.5 text-left font-medium">Sector</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Price</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Score</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Opportunity</th>
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">Signals / Risks</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((o) => (
                  <tr key={o.symbol} className={`border-t border-slate-800/60 ${o.flagged ? "bg-[#c5a35e]/5" : ""}`}>
                    <td className="px-4 py-2.5">
                      <Link href={`/analyze/${o.symbol}`} aria-label={`Analyze ${o.symbol}`} className="font-medium text-slate-100 hover:text-[#e0c887] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
                        {o.symbol}
                      </Link>
                      <span className="text-xs text-slate-400 ml-2 hidden md:inline">{o.companyName}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{o.sector}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">${o.price.toFixed(2)}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums font-medium ${o.score >= 70 ? "text-emerald-300" : o.score >= 60 ? "text-[#e0c887]" : "text-red-300"}`}>
                      {o.score}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-200 font-medium">
                      {o.flagged && <span aria-hidden="true">🚩 </span>}{o.opportunityScore}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400 max-w-md">
                      {o.signals.length > 0 && (
                        <span className="text-emerald-400/80">{o.signals.length} signal{o.signals.length === 1 ? "" : "s"}</span>
                      )}
                      {o.signals.length > 0 && o.risks.length > 0 && " · "}
                      {o.risks.length > 0 && (
                        <span className="text-red-400/80">{o.risks.join("; ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <p className="text-center text-xs text-slate-500 mt-2">
              Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, opportunities.length)} of {opportunities.length}
            </p>
          </div>
        )}

        {unavailable.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            Not available on the current data plan: {unavailable.join(", ")}
          </p>
        )}
      </section>
    </>
  );
}
