"use client";

// Portfolio risk panel — volatility, correlation matrix, candidate what-if.

import { useState } from "react";
import type { RiskReport } from "@/lib/risk";

const pct = (v: number | null, d = 1) => (v === null ? "—" : `${(v * 100).toFixed(d)}%`);

function corrColor(v: number): string {
  if (v >= 0.8) return "bg-red-400/25 text-red-200";
  if (v >= 0.5) return "bg-amber-400/20 text-amber-200";
  if (v >= 0.2) return "bg-slate-700/60 text-slate-200";
  if (v >= -0.2) return "bg-emerald-400/10 text-emerald-200";
  return "bg-emerald-400/25 text-emerald-200";
}

export default function RiskPanel({ clientId }: { clientId: string }) {
  const [report, setReport] = useState<RiskReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState("");
  const [weight, setWeight] = useState("5");

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ clientId });
      if (candidate.trim()) {
        params.set("candidate", candidate.trim().toUpperCase());
        params.set("weight", weight || "5");
      }
      const res = await fetch(`/api/clients/risk?${params}`);
      const data = (await res.json()) as RiskReport & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Risk analysis failed.");
        setReport(null);
      } else {
        setReport(data);
      }
    } catch {
      setError("Risk analysis failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <button
          onClick={run}
          disabled={busy}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 text-sm"
        >
          {busy ? "Computing…" : "📐 Run risk analysis"}
        </button>
        <label className="text-xs text-slate-400">
          What-if: add symbol
          <input
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="e.g. NVDA"
            className="mt-1 w-28 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="text-xs text-slate-400">
          at weight %
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="5"
            className="mt-1 w-16 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
      </div>

      {busy && (
        <p className="text-xs text-slate-500 mb-3">
          Pulling 2 years of daily prices for every holding and computing correlations…
        </p>
      )}
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      {report && (
        <div className="space-y-4">
          {/* headline */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">Portfolio Vol (ann.)</div>
              <div className="text-xl font-semibold tabular-nums text-slate-100">
                {pct(report.portfolioVol)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
              <div className="text-xs uppercase tracking-wider text-slate-500">Observations</div>
              <div className="text-xl font-semibold tabular-nums text-slate-100">
                {report.observations} days
              </div>
            </div>
            {report.candidate && (
              <>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500">
                    + {report.candidate.symbol} @ {pct(report.candidate.weight, 0)}
                  </div>
                  <div className="text-xl font-semibold tabular-nums text-slate-100">
                    {pct(report.candidate.portfolioVolBefore)} → {pct(report.candidate.portfolioVolAfter)}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Verdict</div>
                  <div
                    className={`text-sm font-semibold mt-1 ${report.candidate.diversifies ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {report.candidate.diversifies
                      ? "Diversifies — portfolio vol falls"
                      : "Concentrates — portfolio vol rises"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    avg corr to book: {report.candidate.avgCorrelationToPortfolio?.toFixed(2) ?? "—"} ·
                    own vol {pct(report.candidate.annualVol, 0)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* per-asset */}
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900">
                  <th className="px-4 py-2 text-left font-medium">Holding</th>
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                  <th className="px-3 py-2 text-right font-medium">Vol (ann.)</th>
                  <th className="px-4 py-2 text-right font-medium">Avg corr. to rest</th>
                </tr>
              </thead>
              <tbody>
                {report.assets.map((a) => (
                  <tr key={a.symbol} className="border-t border-slate-800/60">
                    <td className="px-4 py-2 font-medium text-slate-100">{a.symbol}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{pct(a.weight, 0)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-300">{pct(a.annualVol, 0)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-slate-300">
                      {a.avgCorrelation !== null ? a.avgCorrelation.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* correlation matrix */}
          {report.matrix.symbols.length > 1 && (
            <div className="rounded-lg border border-slate-800 overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1.5 bg-slate-900"></th>
                    {report.matrix.symbols.map((s) => (
                      <th key={s} className="px-2 py-1.5 bg-slate-900 text-slate-400 font-medium">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.matrix.symbols.map((a, i) => (
                    <tr key={a}>
                      <th className="px-2 py-1.5 bg-slate-900 text-slate-400 font-medium text-left">{a}</th>
                      {report.matrix.rows[i].map((v, j) => (
                        <td
                          key={j}
                          className={`px-2 py-1.5 text-center tabular-nums ${i === j ? "bg-slate-800 text-slate-500" : corrColor(v)}`}
                        >
                          {v.toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {report.unavailable.length > 0 && (
            <p className="text-xs text-slate-600">
              No price history available for: {report.unavailable.join(", ")}
            </p>
          )}
          <p className="text-xs text-slate-600">
            Based on {report.observations} common trading days of log returns, annualized ×√252.
            Green cells = diversifying (low/negative correlation), red = concentrated.
          </p>
        </div>
      )}
    </div>
  );
}
