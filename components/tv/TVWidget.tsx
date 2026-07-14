"use client";

import { useEffect, useRef } from "react";

/**
 * Generic TradingView embeddable widget. `script` is the widget script name,
 * e.g. "ticker-tape", "market-overview", "stock-heatmap", "forex-cross-rates",
 * "timeline". Config is the widget's JSON options.
 */
export default function TVWidget({
  script,
  config,
  height = 400,
  transparentFrame = false,
}: {
  script: string;
  config: Record<string, unknown>;
  height?: number | string;
  transparentFrame?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    el.innerHTML = "";
    const s = document.createElement("script");
    s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${script}.js`;
    s.async = true;
    s.innerHTML = configJson;
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, [script, configJson]);

  return (
    <div
      className={
        transparentFrame ? "" : "rounded-xl overflow-hidden border border-slate-800"
      }
      style={{ height }}
    >
      <div ref={container} className="tradingview-widget-container h-full w-full" />
    </div>
  );
}
