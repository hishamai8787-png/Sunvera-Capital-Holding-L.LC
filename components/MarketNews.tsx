"use client";

// Market-wide news feed (Finnhub) with category tabs.

import { useEffect, useState } from "react";

interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
}

const CATEGORIES = [
  { key: "general", label: "Markets" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
];

export default function MarketNews() {
  const [category, setCategory] = useState("general");
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    // reset to the loading state whenever the category tab changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(null);
    fetch(`/api/news?category=${category}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setItems(data as NewsItem[]);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-200">News</h3>
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-xs rounded-full px-3 py-1 ${
                category === c.key
                  ? "bg-amber-500 text-slate-950 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-slate-800/60 max-h-[480px] overflow-y-auto">
        {items === null && (
          <li className="px-5 py-6 text-center text-slate-500 text-sm">Loading…</li>
        )}
        {items?.length === 0 && (
          <li className="px-5 py-6 text-center text-slate-500 text-sm">
            No news available (check the Finnhub API key).
          </li>
        )}
        {items?.map((n, i) => (
          <li key={i} className="px-5 py-3">
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-200 hover:text-amber-300 leading-snug"
            >
              {n.headline}
            </a>
            <div className="text-xs text-slate-500 mt-0.5">
              {n.source} · {new Date(n.datetime * 1000).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
