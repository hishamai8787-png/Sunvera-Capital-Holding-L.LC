"use client";

import { useState, useEffect, useRef } from "react";

interface Asset {
  symbol: string;
  label: string;
  category: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  yearHigh?: number | null;
  yearLow?: number | null;
}

interface AssetGridProps {
  type: "forex" | "crypto" | "metals" | "bonds";
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}

const TV_SYMBOL_MAP: Record<string, string> = {
  EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", USDJPY: "FX:USDJPY",
  USDCHF: "FX:USDCHF", AUDUSD: "FX:AUDUSD", USDCAD: "FX:USDCAD",
  NZDUSD: "FX:NZDUSD", USDSEK: "FX:USDSEK", USDNOK: "FX:USDNOK",
  USDSGD: "FX:USDSGD", USDCNH: "FX:USDCNH", USDMXN: "FX:USDMXN",
  USDZAR: "FX:USDZAR", USDTRY: "FX:USDTRY", USDSAR: "FX_IDC:USDSAR",
  USDAED: "FX_IDC:USDAED", USDQAR: "FX_IDC:USDQAR",
  BTCUSD: "BITSTAMP:BTCUSD", ETHUSD: "BITSTAMP:ETHUSD",
  BNBUSD: "BINANCE:BNBUSDT", XRPUSD: "BITSTAMP:XRPUSD",
  SOLUSD: "BINANCE:SOLUSDT", ADAUSD: "BINANCE:ADAUSDT",
  DOGEUSD: "BINANCE:DOGEUSDT", AVAXUSD: "BINANCE:AVAXUSDT",
  DOTUSD: "BINANCE:DOTUSDT", MATICUSD: "BINANCE:MATICUSDT",
  LINKUSD: "BINANCE:LINKUSDT", LTCUSD: "BITSTAMP:LTCUSD",
  XAUUSD: "OANDA:XAUUSD", XAGUSD: "OANDA:XAGUSD",
  XPTUSD: "OANDA:XPTUSD", XPDUSD: "OANDA:XPDUSD",
  XCUUSD: "OANDA:XCUUSD", ALUUSD: "OANDA:ALUUSD",
  ZNCUSD: "OANDA:XZNUSD", NICKEL: "TVC:NICKEL",
  LEADUSD: "OANDA:XPDUSD", TINUSD: "OANDA:XTNUSD",
  CLUSD: "TVC:USOIL", BZUSD: "TVC:UKOIL", NGUSD: "TVC:NATGAS",
  US2Y: "TVC:US02Y", US5Y: "TVC:US05Y", US10Y: "TVC:US10Y",
  US30Y: "TVC:US30Y", DE10Y: "TVC:DE10Y", GB10Y: "TVC:GB10Y",
  JP10Y: "TVC:JP10Y", FR10Y: "TVC:FR10Y", IT10Y: "TVC:IT10Y",
  ES10Y: "TVC:ES10Y", CA5Y: "TVC:CA5YR", AU10Y: "TVC:AU10Y",
};

export default function AssetGrid({ type, title = "", subtitle = "", hideHeader = false }: AssetGridProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const prevPricesRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    mountedRef.current = true;
    const fetchData = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(`/api/assets?type=${type}`);
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        if (!mountedRef.current) return;
        const newAssets: Asset[] = json.assets ?? [];

        // Detect price changes for flash animation
        const changed = new Set<string>();
        newAssets.forEach((a) => {
          const prev = prevPricesRef.current[a.symbol];
          if (prev !== null && prev !== undefined && a.price !== null && a.price !== prev) {
            changed.add(a.symbol);
          }
        });
        // Clear flash after 1s
        if (changed.size > 0) {
          setFlashIds(changed);
          setTimeout(() => { if (mountedRef.current) setFlashIds(new Set()); }, 1000);
        }

        // Update prev prices
        newAssets.forEach((a) => { prevPricesRef.current[a.symbol] = a.price; });

        setAssets(newAssets);
        setLastUpdate(new Date());
        setIsLive(newAssets.some((a) => a.price !== null));
        setLoading(false);
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s refresh for live feel
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [type]);

  const categories = ["all", ...Array.from(new Set(assets.map((a) => a.category)))];
  const filtered = filter === "all" ? assets : assets.filter((a) => a.category === filter);

  function formatPrice(v: number | null): string {
    if (v == null) return "—";
    if (type === "bonds") return `${v.toFixed(3)}%`;
    if (v >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (v >= 1) return v.toFixed(4);
    return v.toFixed(6);
  }

  function tvSymbol(sym: string): string { return TV_SYMBOL_MAP[sym] ?? sym; }

  function formatTime(d: Date | null): string {
    if (!d) return "";
    return d.toLocaleTimeString("en-US", { hour12: false });
  }

  return (
    <div>
      {hideHeader ? null : (
        <>
          {title && <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>}
          {title && <h1 className="text-2xl font-semibold mb-1">{title}</h1>}
          {subtitle && <p className="text-sm text-slate-400 mb-6">{subtitle}</p>}
        </>
      )}

      {/* Live status bar */}
      <div className="flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-semibold tracking-wide">LIVE</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"></span>
              </span>
              <span className="text-slate-500">No live data — API key required</span>
            </>
          )}
        </div>
        {lastUpdate && isLive && (
          <span className="text-slate-500 tabular-nums" aria-live="polite">
            Updated {formatTime(lastUpdate)} · Auto-refresh 15s
          </span>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs rounded-full px-4 py-1.5 transition-colors ${
                filter === cat
                  ? "bg-[#c5a35e]/15 text-[#e0c887] border border-[#c5a35e]/40"
                  : "border border-slate-700 text-slate-400 hover:border-slate-600"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      )}

      {loading && assets.length === 0 && (
        <div role="status" aria-live="polite" className="text-center py-16">
          <div className="inline-block w-8 h-8 border-2 border-[#c5a35e] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-slate-400">Loading live data…</p>
        </div>
      )}

      {/* Asset cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => {
            const tvSym = tvSymbol(a.symbol);
            const isPositive = (a.changePercent ?? 0) > 0;
            const isFlashing = flashIds.has(a.symbol);
            return (
              <div
                key={a.symbol}
                className={`card-surface rounded-xl p-4 hover:border-[#c5a35e]/30 transition-all duration-500 ${
                  isFlashing ? "ring-1 ring-[#c5a35e]/40 bg-slate-800/60" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-100">{a.label}</div>
                    <div className="text-xs text-slate-500">{a.category} · {a.symbol}</div>
                  </div>
                  {a.changePercent != null && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${isPositive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                      {isPositive ? "▲" : "▼"} {Math.abs(a.changePercent).toFixed(2)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold tabular-nums text-slate-100">
                  {formatPrice(a.price)}
                </div>
                {a.change != null && (
                  <div className={`text-xs mt-1 tabular-nums ${isPositive ? "text-green-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{a.change.toFixed(type === "bonds" ? 3 : 4)}
                  </div>
                )}
                {a.yearHigh != null && a.yearLow != null && (
                  <div className="text-xs text-slate-500 mt-2">
                    Range: {formatPrice(a.yearLow)} – {formatPrice(a.yearHigh)}
                  </div>
                )}
                <a
                  href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSym)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-3 text-xs text-[#c5a35e] hover:text-[#e0c887] transition-colors"
                >
                  View chart →
                </a>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No data available for this category.
        </div>
      )}
    </div>
  );
}
