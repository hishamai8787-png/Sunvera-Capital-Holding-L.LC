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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSymbols(saved ? (JSON.parse(saved) as string[]) : DEFAULTS);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSymbols(DEFAULTS);
    }
    setLoaded(true);
  }, []);

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

  useEffect(() => {
    if (!loaded || !symbols.length) return;
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
    <section
      className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden"
      aria-label="Watchlist with live price updates"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-200">
          Watchlist <span className="text-xs text-slate-400 font-normal">(live · 20s refresh)</span>
        </h3>
        <form onSubmit={add} className="flex gap-1.5" aria-label="Add ticker to watchlist">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add ticker"
            aria-label="Ticker symbol to add"
            className="w-28 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-1 focus-visible:outline-[#c5a35e]"
          />
          <button
            type="submit"
            aria-label="Add ticker to watchlist"
            className="rounded-md bg-[#c5a35e] hover:bg-[#d4b06e] text-[#0a0e1a] text-xs font-semibold px-3 py-1 min-w-[32px] min-h-[28px] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
          >
            +
          </button>
        </form>
      </div>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Price</th>
            <th scope="col">Change</th>
            <th scope="col">Actions</th>
            <th scope="col">Remove</th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((s) => {
            const q = quotes[s];
            const up = q && q.changePercent >= 0;
            return (
              <tr key={s} className="border-b border-slate-800/60 last:border-0">
                <td className="px-5 py-2.5">
                  <span className="font-medium text-slate-100">{s}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-200">
                  {q && !q.error ? fmt(q.price) : q?.error ? "—" : "…"}
                </td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums font-medium ${
                    !q || q.error ? "text-slate-400" : up ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {q && !q.error
                    ? `${up ? "+" : ""}${q.changePercent?.toFixed(2)}%`
                    : ""}
                </td>
                <td className="px-3 py-2.5 text-right text-xs whitespace-nowrap">
                  <Link href={`/analyze/${s}`} className="text-[#c5a35e] hover:text-[#e0c887] mr-3 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
                    Analyze
                  </Link>
                  <Link href={`/credit/${s}`} className="text-slate-400 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2">
                    Credit
                  </Link>
                </td>
                <td className="pr-4 py-2.5 text-right w-12">
                  <button
                    onClick={() => remove(s)}
                    aria-label={`Remove ${s} from watchlist`}
                    className="text-slate-400 hover:text-red-400 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
          {loaded && !symbols.length && (
            <tr>
              <td className="px-5 py-6 text-center text-slate-400 text-sm" colSpan={5}>
                Add a ticker above to start your watchlist.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
