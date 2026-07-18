"use client";

import { useState, useEffect, useRef } from "react";

interface DataPoint {
  date: string;
  value: number;
  raw: number;
}

interface Series {
  symbol: string;
  data: DataPoint[];
  startPrice?: number;
  endPrice?: number;
  changePercent?: number;
  error?: string;
}

interface HistoryResponse {
  period: string;
  dates: string[];
  series: Series[];
}

const COLORS = [
  "#c5a35e", "#60a5fa", "#34d399", "#f87171", "#a78bfa", "#fbbf24",
];

const PERIOD_OPTIONS = ["1M", "3M", "6M", "1Y", "5Y"] as const;

const PRESETS: Record<string, { label: string; symbols: string }[]> = {
  forex: [
    { label: "Major Pairs", symbols: "EURUSD,GBPUSD,USDJPY,USDCHF" },
    { label: "USD vs Gulf", symbols: "USDSAR,USDAED,USDQAR,USDJPY" },
    { label: "Commodity Currencies", symbols: "AUDUSD,USDCAD,NZDUSD,USDNOK" },
  ],
  crypto: [
    { label: "BTC vs ETH", symbols: "BTCUSD,ETHUSD" },
    { label: "Top 5", symbols: "BTCUSD,ETHUSD,BNBUSD,SOLUSD,XRPUSD" },
    { label: "Altcoins", symbols: "SOLUSD,ADAUSD,AVAXUSD,DOTUSD,LINKUSD" },
  ],
  metals: [
    { label: "Precious Metals", symbols: "XAUUSD,XAGUSD,XPTUSD,XPDUSD" },
    { label: "Industrial", symbols: "XCUUSD,ALUUSD,ZNCUSD" },
    { label: "Energy", symbols: "CLUSD,BZUSD,NGUSD" },
  ],
  bonds: [
    { label: "US Curve", symbols: "US2Y,US5Y,US10Y,US30Y" },
    { label: "Sovereign 10Y", symbols: "US10Y,DE10Y,GB10Y,JP10Y" },
    { label: "European", symbols: "DE10Y,FR10Y,IT10Y,ES10Y" },
  ],
};

const DEFAULT_SYMBOLS: Record<string, string> = {
  forex: "EURUSD,GBPUSD,USDJPY,USDCHF",
  crypto: "BTCUSD,ETHUSD,SOLUSD",
  metals: "XAUUSD,XAGUSD,XPTUSD,XPDUSD",
  bonds: "US10Y,DE10Y,GB10Y,JP10Y",
};

interface HoverValue {
  symbol: string;
  value: number;
  raw: number;
}

interface HistoryChartProps {
  category: "forex" | "crypto" | "metals" | "bonds";
}

export default function HistoryChart({ category }: HistoryChartProps) {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS[category] ?? "");
  const [period, setPeriod] = useState<string>("3M");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; date: string; values: HoverValue[] } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountedRef = useRef(false);

  const fetchData = async (syms: string, per: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/historical?symbols=${encodeURIComponent(syms)}&period=${per}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Fetch failed" }));
        throw new Error(errData.error || "Fetch failed");
      }
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setLoading(false);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Failed to load historical data.");
        setData(null);
        setLoading(false);
      }
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(symbols, period);
    return () => { mountedRef.current = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Draw chart on canvas
  useEffect(() => {
    if (!data || !canvasRef.current || data.dates.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padL = 50;
    const padR = 15;
    const padT = 20;
    const padB = 30;

    ctx.clearRect(0, 0, W, H);

    let minVal = Infinity;
    let maxVal = -Infinity;
    const validSeries = data.series.filter((s) => s.data.length > 0);
    validSeries.forEach((s) => {
      s.data.forEach((d) => {
        if (d.value < minVal) minVal = d.value;
        if (d.value > maxVal) maxVal = d.value;
      });
    });

    if (minVal === Infinity || maxVal === -Infinity) return;

    const range = maxVal - minVal;
    minVal -= range * 0.05;
    maxVal += range * 0.05;

    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // Grid lines
    ctx.strokeStyle = "rgba(30, 41, 59, 0.5)";
    ctx.lineWidth = 1;
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    for (let i = 0; i <= 5; i++) {
      const y = padT + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const val = maxVal - ((maxVal - minVal) / 5) * i;
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(0), padL - 5, y + 3);
    }

    // Draw series
    validSeries.forEach((s, idx) => {
      const color = COLORS[idx % COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.data.forEach((d, i) => {
        const x = padL + (chartW / (s.data.length - 1 || 1)) * i;
        const y = padT + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // X-axis labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.textAlign = "center";
    ctx.font = "10px monospace";
    const firstSeries = validSeries[0];
    if (firstSeries && firstSeries.data.length > 0) {
      const labels = [0, Math.floor(firstSeries.data.length / 2), firstSeries.data.length - 1];
      labels.forEach((i) => {
        const x = padL + (chartW / (firstSeries.data.length - 1 || 1)) * i;
        const date = firstSeries.data[i].date;
        ctx.fillText(date.slice(5), x, H - padB + 15);
      });
    }

    // Baseline at 100
    if (minVal <= 100 && maxVal >= 100) {
      const y = padT + chartH - ((100 - minVal) / (maxVal - minVal)) * chartH;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [data]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!data || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 50;
    const padR = 15;
    const chartW = rect.width - padL - padR;
    const validSeries = data.series.filter((s) => s.data.length > 0);
    if (validSeries.length === 0) return;
    const firstSeries = validSeries[0];
    const idx = Math.round(((x - padL) / chartW) * (firstSeries.data.length - 1));
    if (idx < 0 || idx >= firstSeries.data.length) {
      setHoverInfo(null);
      return;
    }
    const date = firstSeries.data[idx].date;
    const values: HoverValue[] = validSeries.map((s) => ({
      symbol: s.symbol,
      value: s.data[idx]?.value ?? 0,
      raw: s.data[idx]?.raw ?? 0,
    }));
    setHoverInfo({ x, date, values });
  }

  return (
    <div className="card-surface rounded-xl p-6 mt-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        <span aria-hidden="true">📈</span> Historical Comparison
      </h2>
      <p className="text-xs text-slate-400 mb-4">Normalized to 100 at start of period. Compare performance across assets.</p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={symbols}
          onChange={(e) => setSymbols(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && fetchData(symbols, period)}
          placeholder="Symbols (comma-separated)"
          className="flex-1 min-w-[200px] rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#c5a35e] uppercase"
        />
        <div className="flex gap-1 rounded-lg border border-slate-700 overflow-hidden">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); fetchData(symbols, p); }}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-[#c5a35e]/15 text-[#e0c887]"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchData(symbols, period)}
          disabled={loading}
          className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] text-[#0a0e1a] font-semibold px-4 py-2 text-sm transition-all disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {/* Presets */}
      {PRESETS[category] && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-slate-500 pt-1">Presets:</span>
          {PRESETS[category].map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setSymbols(preset.symbols); fetchData(preset.symbols, period); }}
              className="text-xs rounded-full border border-slate-700 hover:border-[#c5a35e] hover:text-[#e0c887] px-3 py-1 text-slate-400 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div role="status" aria-live="polite" className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[#c5a35e] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-slate-400">Loading historical data…</p>
        </div>
      )}

      {!loading && data && data.series.length > 0 && (
        <div className="space-y-4">
          <div className="relative" style={{ width: "100%", height: "320px" }}>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverInfo(null)}
              className="w-full h-full"
              role="img"
              aria-label="Historical price comparison chart"
            />
            {hoverInfo && (
              <div
                className="absolute top-0 pointer-events-none rounded-lg bg-slate-900/95 border border-slate-700 px-3 py-2 text-xs shadow-xl z-10"
                style={{ left: `${Math.min(Math.max(hoverInfo.x + 10, 0), 100)}px` }}
              >
                <div className="text-slate-400 mb-1">{hoverInfo.date}</div>
                {hoverInfo.values.map((v, i) => (
                  <div key={v.symbol} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-300 font-medium">{v.symbol}</span>
                    <span className="text-slate-400 tabular-nums ml-auto">{v.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legend / performance summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.series.map((s, idx) => {
              const change = s.changePercent ?? 0;
              const isPositive = change > 0;
              return (
                <div key={s.symbol} className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs font-semibold text-slate-200">{s.symbol}</span>
                  </div>
                  {s.error ? (
                    <div className="text-xs text-slate-500">{s.error}</div>
                  ) : (
                    <>
                      <div className={`text-sm font-bold tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                        {isPositive ? "+" : ""}{change.toFixed(2)}%
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                        {s.startPrice?.toFixed(4)} → {s.endPrice?.toFixed(4)}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-12 text-slate-500 text-sm">
          Select assets and a time period to see the comparison chart.
        </div>
      )}
    </div>
  );
}
