"use client";

import { useEffect, useRef, useState } from "react";

/** TradingView advanced chart embed (free widget) with lazy loading. */
export default function TradingViewChart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Lazy load: only mount the TradingView script when the chart scrolls into view
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = container.current;
    if (!el) return;
    el.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      autosize: true,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      hide_top_toolbar: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
    return () => {
      el.innerHTML = "";
    };
  }, [symbol, visible]);

  return (
    <section
      aria-label={`TradingView chart for ${symbol}`}
      className="h-[480px] rounded-xl overflow-hidden border border-slate-800 relative"
    >
      <div ref={sentinel} className="absolute inset-0" />
      {!visible && (
        <div className="flex items-center justify-center h-full text-slate-500 text-sm" role="status" aria-live="polite">
          Loading chart...
        </div>
      )}
      <div
        ref={container}
        className="tradingview-widget-container h-full w-full"
        style={{ display: visible ? "block" : "none" }}
      />
    </section>
  );
}
