"use client";

// Personal watchlist — stored in the browser (localStorage), quotes refresh
// every 20 seconds via /api/quote. Each row links to analysis & credit modules.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/components/CurrencyProvider";

interface WatchQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  error?: boolean;
}

const STORAGE_KEY = "sunvera-watchlist";
const DEFAULTS = ["AAPL", "MSFT", "GOOGL", "NKE"];
const REFRESH_MS = 20_000;

export default function Watchlist() {
  const { fmt } = useCurrency();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, WatchQuote>>({});
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // load saved list
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // hydrate from localStorage after mount (not available during SSR)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSymbols(saved ? (JSON.parse(saved) as string[]) : DEFAULTS);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSymbols(DEFAULTS);
    }
    setLoaded(true);
  }, []);

  // persist
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  }, [symbols, loaded]);

  const refresh = useCallback(async (syms: string[]) => {
    const results = await Promise.all(
      syms.map(async (s): Promise<WatchQuote> => {
        try {
          const res = await fetch(`/api/quote/${encodeURIComponent(s)}`);
          if (!res.ok) throw new Error();
          return (await res.json()) as WatchQuote;
        } catch {
          return { symbol: s, price: 0, change: 0, changePercent: 0, previousClose: 0, error: true };
        }
      })
    );
    setQuotes((prev) => {
      const next = { ...prev };
      for (const q of results) next[q.symbol] = q;
      return next;
    });
  }, []);

  // poll
  useEffect(() => {
    if (!loaded || !symbols.length) return;
    // immediate fetch on mount/list change, then poll on an interval
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(symbols);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => refresh(symbols), REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [symbols, loaded, refresh]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s && !symbols.includes(s)) setSymbols((prev) => [...prev, s]);
    setInput("");
  };
  const remove = (s: string) => setSymbols((prev) => prev.filter((x) => x !== s));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-200">
          Watchlist <span className="text-xs text-slate-500 font-normal">(live · 20s refresh)</span>
        </h3>
        <form onSubmit={add} className="flex gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add ticker"
            className="w-28 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-3 py-1"
          >
            +
          </button>
        </form>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {symbols.map((s) => {
            const q = quotes[s];
            const up = q && q.changePercent >= 0;
            return (
              <tr key={s} className="border-b border-slate-800/60 last:border-0 group">
                <td className="px-5 py-2.5">
                  <span className="font-medium text-slate-100">{s}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                  {q && !q.error ? fmt(q.price) : q?.error ? "—" : "…"}
                </td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                    !q || q.error ? "text-slate-600" : up ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {q && !q.error
                    ? `${up ? "+" : ""}${q.changePercent?.toFixed(2)}%`
                    : ""}
                </td>
                <td className="px-3 py-2.5 text-right text-xs whitespace-nowrap">
                  <Link href={`/analyze/${s}`} className="text-amber-300/80 hover:text-amber-200 mr-3">
                    Analyze
                  </Link>
                  <Link href={`/credit/${s}`} className="text-slate-400 hover:text-slate-200">
                    Credit
                  </Link>
                </td>
                <td className="pr-4 py-2.5 text-right w-8">
                  <button
                    onClick={() => remove(s)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${s}`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
          {loaded && !symbols.length && (
            <tr>
              <td className="px-5 py-6 text-center text-slate-500 text-sm" colSpan={5}>
                Add a ticker above to start your watchlist.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
