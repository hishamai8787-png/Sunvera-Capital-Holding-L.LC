"use client";

import { useState, useCallback } from "react";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "NZD", name: "NZ Dollar", flag: "🇳🇿" },
  { code: "SEK", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "CNH", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦" },
  { code: "TRY", name: "Turkish Lira", flag: "🇹🇷" },
  { code: "SAR", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "QAR", name: "Qatari Riyal", flag: "🇶🇦" },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "KRW", name: "Korean Won", flag: "🇰🇷" },
];

interface ConvertResult {
  from: string;
  to: string;
  rate: number;
  amount: number;
  converted: number;
  pair: string;
}

export default function ForexConverter() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("1000");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/convert?from=${from}&to=${to}&amount=${amt}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Conversion failed" }));
        throw new Error(errData.error || "Conversion failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, amount]);

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  function formatAmount(v: number): string {
    if (v >= 1e6) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return v.toFixed(6);
  }

  // Quick conversion table (common amounts)
  const quickAmounts = [1, 10, 100, 1000, 10000];

  return (
    <div className="card-surface rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        <span aria-hidden="true">💱</span> Currency Converter
      </h2>
      <p className="text-xs text-slate-400 mb-4">Live rates via FMP. Convert between 20+ currencies.</p>

      {/* Main converter */}
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end mb-4">
        {/* From */}
        <div>
          <label htmlFor="from-currency" className="block text-xs text-slate-400 mb-1">From</label>
          <div className="flex gap-2">
            <select
              id="from-currency"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setResult(null); }}
              className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] flex-1"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConvert()}
              placeholder="Amount"
              className="w-32 rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] tabular-nums"
            />
          </div>
        </div>

        {/* Swap button */}
        <button
          onClick={swapCurrencies}
          aria-label="Swap currencies"
          className="self-end rounded-lg border border-slate-700 hover:border-[#c5a35e] hover:text-[#c5a35e] px-3 py-2.5 text-slate-400 transition-colors mb-0.5"
        >
          ⇄
        </button>

        {/* To */}
        <div>
          <label htmlFor="to-currency" className="block text-xs text-slate-400 mb-1">To</label>
          <select
            id="to-currency"
            value={to}
            onChange={(e) => { setTo(e.target.value); setResult(null); }}
            className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleConvert}
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Converting…" : "Convert"}
      </button>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4" aria-live="polite">
          {/* Main result */}
          <div className="text-center rounded-lg bg-slate-800/50 border border-slate-700/50 p-5">
            <div className="text-xs text-slate-400 mb-1">
              {formatAmount(result.amount)} {result.from} =
            </div>
            <div className="text-3xl font-bold tabular-nums text-[#e0c887]">
              {formatAmount(result.converted)} {result.to}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              1 {result.from} = {result.rate.toFixed(6)} {result.to}
            </div>
          </div>

          {/* Quick conversion table */}
          <div className="rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th scope="col" className="text-left px-3 py-2 font-medium text-slate-400">{result.from}</th>
                  <th scope="col" className="text-right px-3 py-2 font-medium text-slate-400">{result.to}</th>
                </tr>
              </thead>
              <tbody>
                {quickAmounts.map((amt) => (
                  <tr key={amt} className="border-b border-slate-800/50">
                    <td className="px-3 py-2 text-slate-300 tabular-nums">{formatAmount(amt)}</td>
                    <td className="px-3 py-2 text-right text-slate-200 tabular-nums">
                      {formatAmount(amt * result.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
