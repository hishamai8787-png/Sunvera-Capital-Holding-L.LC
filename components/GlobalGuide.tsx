"use client";

// Global market entry guide + tax comparison, tabbed.

import { useState } from "react";
import { COUNTRY_GUIDES, DISCLAIMER, type CountryGuide } from "@/lib/countries";

function CountryCard({ g }: { g: CountryGuide }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-900"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{g.flag}</span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-100">{g.country}</div>
            <div className="text-xs text-slate-500 truncate">
              {g.exchanges} · {g.currency} · {g.region}
            </div>
          </div>
        </div>
        <span className="text-slate-500 shrink-0 ml-3">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-slate-800 pt-4">
          <p className="text-sm text-slate-300">{g.access}</p>

          {/* Brokers */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2">
              Recommended brokers
            </h4>
            <ul className="space-y-1.5">
              {g.brokers.map((b) => (
                <li key={b.name} className="text-sm">
                  <span className="text-slate-100 font-medium">{b.name}</span>
                  <span className="text-slate-400"> — {b.note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300/90 mb-2">
              Requirements & how to obtain them
            </h4>
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {g.requirements.map((r) => (
                    <tr key={r.item} className="border-b border-slate-800/60 last:border-0 align-top">
                      <td className="px-4 py-2.5 font-medium text-slate-200 w-1/4">{r.item}</td>
                      <td className="px-4 py-2.5 text-slate-400">{r.detail}</td>
                      <td className="px-4 py-2.5 text-slate-400 w-1/3">
                        {r.howToObtain !== "—" && (
                          <span className="text-emerald-300/80">How: </span>
                        )}
                        {r.howToObtain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual vs entity */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                👤 As an individual
              </h4>
              <ul className="space-y-1 text-sm">
                {g.individual.pros.map((p) => (
                  <li key={p} className="text-emerald-300/90">+ {p}</li>
                ))}
                {g.individual.cons.map((p) => (
                  <li key={p} className="text-red-300/80">− {p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-800 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                🏢 As a business entity
              </h4>
              <ul className="space-y-1 text-sm">
                {g.entity.pros.map((p) => (
                  <li key={p} className="text-emerald-300/90">+ {p}</li>
                ))}
                {g.entity.cons.map((p) => (
                  <li key={p} className="text-red-300/80">− {p}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tax snapshot */}
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-2">
              Tax snapshot
            </h4>
            <dl className="text-sm space-y-1.5">
              <div>
                <dt className="inline text-slate-400">Capital gains: </dt>
                <dd className="inline text-slate-200">{g.tax.capitalGains}</dd>
              </div>
              <div>
                <dt className="inline text-slate-400">Dividends: </dt>
                <dd className="inline text-slate-200">{g.tax.dividends}</dd>
              </div>
              {g.tax.other !== "—" && (
                <div>
                  <dt className="inline text-slate-400">Also note: </dt>
                  <dd className="inline text-slate-200">{g.tax.other}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlobalGuide() {
  const [tab, setTab] = useState<"entry" | "tax">("entry");
  const [residency, setResidency] = useState("QA");
  const home = COUNTRY_GUIDES.find((g) => g.code === residency)!;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 w-fit">
        {(
          [
            { key: "entry", label: "🌍 Market Entry Guide" },
            { key: "tax", label: "🧾 Tax Comparison & Strategies" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-amber-500 text-slate-950"
                : "text-slate-300 hover:text-amber-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "entry" && (
        <div className="space-y-3">
          {COUNTRY_GUIDES.map((g) => (
            <CountryCard key={g.code} g={g} />
          ))}
        </div>
      )}

      {tab === "tax" && (
        <div className="space-y-6">
          {/* Comparison table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900">
                    <th className="px-4 py-2.5 text-left font-medium">Market</th>
                    <th className="px-4 py-2.5 text-left font-medium">Capital Gains</th>
                    <th className="px-4 py-2.5 text-left font-medium">Dividends</th>
                    <th className="px-4 py-2.5 text-left font-medium">Other</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_GUIDES.map((g) => (
                    <tr key={g.code} className="border-t border-slate-800/60 align-top">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-100">
                        {g.flag} {g.country}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{g.tax.capitalGains}</td>
                      <td className="px-4 py-3 text-slate-300">{g.tax.dividends}</td>
                      <td className="px-4 py-3 text-slate-400">{g.tax.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Residency-based strategies */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Optimization ideas for a resident of
              </h3>
              <select
                value={residency}
                onChange={(e) => setResidency(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
              >
                {COUNTRY_GUIDES.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.flag} {g.country}
                  </option>
                ))}
              </select>
            </div>
            <ul className="space-y-2">
              {home.tax.optimizations.map((o) => (
                <li key={o} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-amber-400 shrink-0">→</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              Cross-border rule of thumb: your residence country usually taxes your worldwide
              gains, while the source country takes dividend withholding — treaties decide how much
              and what gets credited. When investing abroad, compare the same exposure via local
              shares, foreign-listed ETFs (e.g., Ireland-domiciled for US assets), and depositary
              receipts — the withholding leakage often differs by 15 percentage points or more.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 leading-relaxed border border-slate-800 rounded-lg p-3 bg-slate-900/40">
        ⚠️ {DISCLAIMER}
      </p>
    </div>
  );
}
