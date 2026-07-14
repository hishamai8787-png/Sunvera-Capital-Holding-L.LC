"use client";

// Global display-currency context: fetches USD→X rates once, persists the
// user's choice, and converts any USD amount for display.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface CurrencyContextValue {
  currency: string;
  setCurrency: (c: string) => void;
  /** Convert a USD amount to the display currency. */
  convert: (usd: number) => number;
  /** Format a USD amount in the display currency, e.g. "€1.2K". */
  fmt: (usd: number) => string;
  available: string[];
}

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF ",
  CAD: "C$",
  PHP: "₱",
  QAR: "QR ",
  SAR: "SR ",
  AED: "AED ",
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  convert: (v) => v,
  fmt: (v) => `$${v.toFixed(2)}`,
  available: ["USD"],
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

const STORAGE_KEY = "sunvera-display-currency";

export default function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    // restore saved choice + load rates after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrencyState(localStorage.getItem(STORAGE_KEY) || "USD");
    fetch("/api/fx")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { rates?: Record<string, number> } | null) => {
        if (d?.rates) setRates(d.rates);
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  const rate = rates[currency] ?? 1;
  const convert = (usd: number) => usd * rate;
  const fmt = (usd: number) => {
    const v = usd * rate;
    const sym = SYMBOLS[currency] ?? `${currency} `;
    const sign = v < 0 ? "-" : "";
    const abs = Math.abs(v);
    const digits = currency === "JPY" ? 0 : 2;
    if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e4) return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${sym}${abs.toFixed(digits)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convert,
        fmt,
        available: Object.keys(rates),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function CurrencySelect() {
  const { currency, setCurrency, available } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      className="rounded-lg bg-slate-800/80 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400 cursor-pointer"
      title="Display currency (converts portfolio values and prices)"
    >
      {available.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
