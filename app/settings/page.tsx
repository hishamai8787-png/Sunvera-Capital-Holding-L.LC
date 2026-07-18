"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [currency, setCurrency] = useState("USD");
  const [defaultTicker, setDefaultTicker] = useState("");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  if (!loaded && typeof window !== "undefined") {
    setCurrency(localStorage.getItem("sunvera-currency") || "USD");
    setDefaultTicker(localStorage.getItem("sunvera-default-ticker") || "");
    setLoaded(true);
  }

  const handleSave = useCallback(() => {
    localStorage.setItem("sunvera-currency", currency);
    localStorage.setItem("sunvera-default-ticker", defaultTicker);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [currency, defaultTicker]);

  const handleClearWatchlist = useCallback(() => {
    if (confirm("Clear your saved watchlist? This cannot be undone.")) {
      localStorage.removeItem("sunvera-watchlist");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }, []);

  return (
    <main className="text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Preferences</h1>

        {saved && (
          <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-[#c5a35e]/40 bg-[#c5a35e]/10 px-4 py-3 text-[#e0c887]">
            ✅ Settings saved.
          </div>
        )}

        <section className="space-y-6">
          <div className="card-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Display Currency</h2>
            <p className="text-sm text-slate-400 mb-4">Converts portfolio values and prices across the platform.</p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] cursor-pointer"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="SAR">SAR — Saudi Riyal</option>
              <option value="AED">AED — UAE Dirham</option>
              <option value="QAR">QAR — Qatari Riyal</option>
              <option value="JPY">JPY — Japanese Yen</option>
              <option value="CHF">CHF — Swiss Franc</option>
            </select>
          </div>

          <div className="card-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Default Ticker</h2>
            <p className="text-sm text-slate-400 mb-4">Start page loads this ticker by default.</p>
            <input
              type="text"
              value={defaultTicker}
              onChange={(e) => setDefaultTicker(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. AAPL"
              maxLength={6}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] uppercase"
            />
          </div>

          <div className="card-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Data Management</h2>
            <p className="text-sm text-slate-400 mb-4">
              Your watchlist and preferences are stored in your browser. Clear them anytime.
            </p>
            <button
              onClick={handleClearWatchlist}
              className="rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium px-6 py-2.5 transition-all"
            >
              Clear Watchlist
            </button>
          </div>

          <div className="card-surface rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            <p className="text-sm text-slate-400 mb-4">
              Admin access requires login credentials configured by your administrator.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg border border-slate-700 hover:border-[#c5a35e] text-slate-200 font-medium px-6 py-2.5 transition-colors"
            >
              Admin Login
            </Link>
          </div>

          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-8 py-3 transition-all"
          >
            Save Preferences
          </button>
        </section>
      </div>
    </main>
  );
}
