"use client";

// Autocomplete ticker search — type a name or symbol, pick a company, go.
// WCAG 4.1.2: Full ARIA combobox pattern.

import { useEffect, useRef, useState, useId } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

export default function TickerSearch({
  size = "sm",
  autoFocus = false,
  placeholder = "Search company or ticker…",
}: {
  size?: "sm" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    const q = query.trim();
    if (q.length < 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as Suggestion[];
        setResults(data);
        setOpen(true);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/analyze/${encodeURIComponent(symbol)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && results[active]) go(results[active].symbol);
      else if (query.trim()) go(query.trim().toUpperCase());
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const inputCls =
    size === "lg"
      ? "w-full rounded-xl bg-slate-800/80 border border-slate-700 pl-11 pr-4 py-3.5 text-lg"
      : "w-full rounded-lg bg-slate-800/80 border border-slate-700 pl-9 pr-3 py-2 text-sm";

  const activeOptionId = open && results[active] ? `${listboxId}-${active}` : undefined;

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          if (open && results[active]) go(results[active].symbol);
          else if (query.trim()) go(query.trim().toUpperCase());
        }}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none ${size === "lg" ? "left-4" : "left-3"}`}
          aria-hidden="true"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-500 border-t-amber-400 rounded-full animate-spin" />
          ) : (
            "🔍"
          )}
        </span>
        <input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={`${inputCls} text-slate-100 outline-none focus:border-amber-400 focus:border-[#c5a35e] placeholder:text-slate-500 transition-colors`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-label="Search for a company or ticker symbol"
        />
      </form>

      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute z-50 mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden"
        >
          {results.map((r, i) => (
            <li key={r.symbol} role="option" id={`${listboxId}-${i}`} aria-selected={i === active}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(r.symbol);
                }}
                onMouseEnter={() => setActive(i)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left ${
                  i === active ? "bg-amber-500/10" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="font-semibold text-slate-100">{r.symbol}</span>
                  <span className="ml-2 text-sm text-slate-400 truncate">{r.name}</span>
                </span>
                <span className="ml-3 shrink-0 text-xs text-slate-500">{r.exchange}</span>
              </button>
            </li>
          ))}
          <li className="px-4 py-1.5 text-[11px] text-slate-400 bg-slate-950/50" aria-hidden="true">
            ↑↓ navigate · Enter to analyze
          </li>
        </ul>
      )}
    </div>
  );
}
