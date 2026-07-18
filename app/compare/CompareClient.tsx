"use client";

import { useState, useCallback } from "react";

interface CompanyData {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  marketCap?: number;
  price?: number;
  changePercent?: number;
  beta?: number;
  peRatio?: number | null;
  eps?: number | null;
  dividendYield?: number;
  profitMargin?: number;
  ebitdaMargin?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  fcfYield?: number;
  ocfPerShare?: number;
  country?: string;
  currency?: string;
  image?: string;
  description?: string;
  error?: string;
}

type MetricValue = number | null | undefined;

const METRICS: { key: keyof CompanyData; label: string; format: (v: MetricValue) => string }[] = [
  { key: "price", label: "Price", format: (v) => v != null ? `$${v.toFixed(2)}` : "—" },
  { key: "changePercent", label: "Change %", format: (v) => v != null ? `${v > 0 ? "+" : ""}${v.toFixed(2)}%` : "—" },
  { key: "marketCap", label: "Market Cap", format: (v) => v ? formatLarge(v) : "—" },
  { key: "peRatio", label: "P/E Ratio", format: (v) => v != null ? v.toFixed(1) : "—" },
  { key: "eps", label: "EPS", format: (v) => v != null ? `$${v.toFixed(2)}` : "—" },
  { key: "dividendYield", label: "Div Yield", format: (v) => v ? `${v.toFixed(2)}%` : "—" },
  { key: "profitMargin", label: "Profit Margin", format: (v) => v ? `${v.toFixed(1)}%` : "—" },
  { key: "ebitdaMargin", label: "EBITDA Margin", format: (v) => v ? `${v.toFixed(1)}%` : "—" },
  { key: "roe", label: "ROE", format: (v) => v ? `${v.toFixed(1)}%` : "—" },
  { key: "roa", label: "ROA", format: (v) => v ? `${v.toFixed(1)}%` : "—" },
  { key: "debtToEquity", label: "Debt/Equity", format: (v) => v ? v.toFixed(2) : "—" },
  { key: "currentRatio", label: "Current Ratio", format: (v) => v ? v.toFixed(2) : "—" },
  { key: "fcfYield", label: "FCF Yield", format: (v) => v ? `${v.toFixed(2)}%` : "—" },
  { key: "ocfPerShare", label: "OCF/Share", format: (v) => v ? `$${v.toFixed(2)}` : "—" },
  { key: "beta", label: "Beta", format: (v) => v ? v.toFixed(2) : "—" },
];

function formatLarge(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toFixed(0)}`;
}

const presetExamples = [
  { label: "Tech Giants", symbols: "AAPL,MSFT,GOOGL,AMZN,META" },
  { label: "Banks", symbols: "JPM,BAC,GS,MS,WFC" },
  { label: "Oil & Gas", symbols: "XOM,CVX,COP,SLB,EOCC" },
  { label: "Auto Makers", symbols: "TSLA,F,NIO,RIVN,GM" },
];

export default function CompareClient() {
  const [symbols, setSymbols] = useState("");
  const [data, setData] = useState<CompanyData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = useCallback(async () => {
    const parsed = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (parsed.length < 2) {
      setError("Enter at least 2 ticker symbols, separated by commas.");
      return;
    }
    if (parsed.length > 5) {
      setError("Maximum 5 companies for comparison.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/compare?symbols=${parsed.join(",")}`);
      if (!res.ok) throw new Error("Comparison failed");
      const json = await res.json();
      setData(json.companies);
    } catch {
      setError("Unable to fetch comparison data. Try again.");
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  return (
    <div>
      {/* Input */}
      <div className="card-surface rounded-xl p-6 mb-6">
        <label htmlFor="compare-input" className="block text-sm font-medium text-slate-300 mb-2">
          Ticker Symbols (comma-separated)
        </label>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            id="compare-input"
            type="text"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleCompare()}
            placeholder="e.g. AAPL, MSFT, GOOGL"
            className="flex-1 rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] uppercase tracking-wider"
          />
          <button
            onClick={handleCompare}
            disabled={loading}
            aria-busy={loading}
            className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-8 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Comparing…" : "Compare"}
          </button>
        </div>

        {/* Presets */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 pt-1.5">Presets:</span>
          {presetExamples.map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setSymbols(preset.symbols); }}
              className="text-xs rounded-full border border-slate-700 hover:border-[#c5a35e] hover:text-[#e0c887] px-3 py-1 text-slate-400 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div role="status" aria-live="polite" className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-[#c5a35e] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-slate-400">Fetching financial data…</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {/* Company cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.map((c) => (
              <div key={c.symbol} className={`card-surface rounded-xl p-4 ${c.error ? "opacity-60" : ""}`}>
                {c.image && (
                  <img src={c.image} alt={`${c.symbol} logo`} className="w-10 h-10 rounded mb-2" />
                )}
                <div className="text-sm font-bold text-[#e0c887]">{c.symbol}</div>
                <div className="text-xs text-slate-400 truncate">{c.name ?? c.error}</div>
                {c.sector && <div className="text-xs text-slate-500 mt-1">{c.sector}</div>}
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="card-surface rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-300">Metric</th>
                  {data.map((c) => (
                    <th scope="col" key={c.symbol} className="text-right px-4 py-3 font-semibold text-[#e0c887] whitespace-nowrap">
                      {c.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m, idx) => (
                  <tr key={m.key} className={idx % 2 === 0 ? "bg-slate-800/30" : ""}>
                    <td className="px-4 py-2.5 text-slate-400 font-medium">{m.label}</td>
                    {data.map((c) => {
                      const val = c[m.key as keyof CompanyData] as MetricValue;
                      const isChange = m.key === "changePercent";
                      return (
                        <td
                          key={c.symbol}
                          className={`px-4 py-2.5 text-right tabular-nums ${
                            isChange && typeof val === "number"
                              ? val > 0 ? "text-green-400" : "text-red-400"
                              : "text-slate-200"
                          }`}
                        >
                          {c.error ? "—" : m.format(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Sector row */}
                <tr className="bg-slate-800/30">
                  <td className="px-4 py-2.5 text-slate-400 font-medium">Sector</td>
                  {data.map((c) => (
                    <td key={c.symbol} className="px-4 py-2.5 text-right text-xs text-slate-300">
                      {c.sector ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-slate-400 font-medium">Industry</td>
                  {data.map((c) => (
                    <td key={c.symbol} className="px-4 py-2.5 text-right text-xs text-slate-300">
                      {c.industry ?? "—"}
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-800/30">
                  <td className="px-4 py-2.5 text-slate-400 font-medium">Country</td>
                  {data.map((c) => (
                    <td key={c.symbol} className="px-4 py-2.5 text-right text-xs text-slate-300">
                      {c.country ?? "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.filter((c) => c.description).map((c) => (
              <div key={c.symbol} className="card-surface rounded-xl p-4">
                <div className="text-sm font-semibold text-[#e0c887] mb-1">{c.symbol} — {c.name}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-16 text-slate-500">
          Enter ticker symbols above to begin a side-by-side comparison.
        </div>
      )}
    </div>
  );
}
