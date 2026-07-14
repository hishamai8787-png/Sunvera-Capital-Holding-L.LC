"use client";

// Client & mandate manager — add/edit clients, positions with live P&L,
// target weights with drift alerts, portfolio risk, and mandate screening.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Client, Mandate, Position, SymbolEvaluation, MandateCheck } from "@/lib/clientTypes";
import { DRIFT_ALERT_PP } from "@/lib/clientTypes";
import RiskPanel from "@/components/RiskPanel";
import { useCurrency } from "@/components/CurrencyProvider";

/* ---------- helpers ---------- */

const uid = () => Math.random().toString(36).slice(2, 10);

const newClient = (): Client => ({
  id: uid(),
  name: "",
  notes: "",
  mandate: {
    minScore: null,
    maxPE: null,
    minDividendYield: null,
    maxNetDebtEbitda: null,
    minInterestCoverage: null,
    minMarketCap: null,
    sectors: [],
  },
  positions: [],
});

interface Quote {
  price: number;
  changePercent: number;
}

interface ScreenResult {
  holdings: SymbolEvaluation[];
  opportunities: SymbolEvaluation[];
  unavailable: string[];
  generatedAt: string;
}

/* ---------- mandate editor ---------- */

function MandateEditor({
  mandate,
  onChange,
}: {
  mandate: Mandate;
  onChange: (m: Mandate) => void;
}) {
  const num = (v: string): number | null => (v.trim() === "" ? null : Number(v) || null);
  const fields: {
    label: string;
    value: string;
    set: (v: string) => void;
    hint: string;
  }[] = [
    {
      label: "Min Sunvera score",
      value: mandate.minScore?.toString() ?? "",
      set: (v) => onChange({ ...mandate, minScore: num(v) }),
      hint: "0-100",
    },
    {
      label: "Max P/E",
      value: mandate.maxPE?.toString() ?? "",
      set: (v) => onChange({ ...mandate, maxPE: num(v) }),
      hint: "e.g. 25",
    },
    {
      label: "Min dividend yield %",
      value: mandate.minDividendYield !== null ? (mandate.minDividendYield * 100).toString() : "",
      set: (v) =>
        onChange({ ...mandate, minDividendYield: v.trim() === "" ? null : (Number(v) || 0) / 100 }),
      hint: "e.g. 2.5",
    },
    {
      label: "Max Net Debt/EBITDA",
      value: mandate.maxNetDebtEbitda?.toString() ?? "",
      set: (v) => onChange({ ...mandate, maxNetDebtEbitda: num(v) }),
      hint: "e.g. 3",
    },
    {
      label: "Min interest coverage",
      value: mandate.minInterestCoverage?.toString() ?? "",
      set: (v) => onChange({ ...mandate, minInterestCoverage: num(v) }),
      hint: "e.g. 5",
    },
    {
      label: "Min market cap ($B)",
      value: mandate.minMarketCap !== null ? (mandate.minMarketCap / 1e9).toString() : "",
      set: (v) =>
        onChange({ ...mandate, minMarketCap: v.trim() === "" ? null : (Number(v) || 0) * 1e9 }),
      hint: "e.g. 10",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {fields.map((f) => (
          <label key={f.label} className="text-xs text-slate-400">
            {f.label}
            <input
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.hint}
              className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
            />
          </label>
        ))}
      </div>
      <label className="block text-xs text-slate-400 mt-3">
        Allowed sectors (comma-separated, blank = all)
        <input
          value={mandate.sectors.join(", ")}
          onChange={(e) =>
            onChange({
              ...mandate,
              sectors: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="e.g. Technology, Consumer Staples, Financial Services"
          className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />
      </label>
      <p className="text-[11px] text-slate-600 mt-2">
        Leave any rule blank to skip it. Rules are checked against the full analysis engine (score,
        valuation, leverage, coverage) each time you run a screen.
      </p>
    </div>
  );
}

/* ---------- evaluation display ---------- */

function CheckBadges({ checks }: { checks: MandateCheck[] }) {
  if (!checks.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {checks.map((c) => (
        <span
          key={c.rule}
          title={`${c.rule}: ${c.actual} (limit ${c.limit})`}
          className={`text-[11px] rounded-full px-2 py-0.5 border ${
            c.pass === false
              ? "border-red-400/40 text-red-300 bg-red-400/5"
              : "border-emerald-400/30 text-emerald-300 bg-emerald-400/5"
          }`}
        >
          {c.pass === false ? "✕" : "✓"} {c.rule.replace(/^(Minimum|Maximum) /, "")}: {c.actual}
        </span>
      ))}
    </div>
  );
}

function EvalRow({ ev, highlight }: { ev: SymbolEvaluation; highlight: boolean }) {
  if (ev.error) {
    return (
      <div className="px-4 py-3 border-t border-slate-800/60">
        <span className="font-medium text-slate-400">{ev.symbol}</span>
        <span className="text-xs text-slate-600 ml-2">{ev.error}</span>
      </div>
    );
  }
  return (
    <div
      className={`px-4 py-3 border-t border-slate-800/60 ${highlight ? "bg-emerald-400/5" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div>
          <Link
            href={`/analyze/${ev.symbol}`}
            className="font-medium text-slate-100 hover:text-amber-300"
          >
            {ev.symbol}
          </Link>
          <span className="text-sm text-slate-500 ml-2">{ev.companyName}</span>
          <span className="text-xs text-slate-600 ml-2">{ev.sector}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-300 tabular-nums">
            Score{" "}
            <b
              className={
                ev.score >= 70
                  ? "text-emerald-300"
                  : ev.score >= 60
                    ? "text-amber-300"
                    : "text-red-300"
              }
            >
              {ev.score}
            </b>
          </span>
          <span
            className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
              ev.fits ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/10 text-red-300"
            }`}
          >
            {ev.fits
              ? "FITS MANDATE"
              : `${ev.failedRules.length} RULE${ev.failedRules.length === 1 ? "" : "S"} FAILED`}
          </span>
        </div>
      </div>
      <CheckBadges checks={ev.checks} />
    </div>
  );
}

/* ---------- positions table ---------- */

function PositionsEditor({
  positions,
  quotes,
  onChange,
}: {
  positions: Position[];
  quotes: Record<string, Quote>;
  onChange: (p: Position[]) => void;
}) {
  const { fmt } = useCurrency();
  const [sym, setSym] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [target, setTarget] = useState("");

  const add = () => {
    const s = sym.trim().toUpperCase();
    if (!s || !Number(qty)) return;
    onChange([
      ...positions,
      {
        symbol: s,
        quantity: Number(qty),
        costBasis: Number(cost) || 0,
        targetPct: target.trim() === "" ? null : (Number(target) || 0) / 100,
      },
    ]);
    setSym("");
    setQty("");
    setCost("");
    setTarget("");
  };

  const totalValue = positions.reduce((sum, p) => {
    const q = quotes[p.symbol];
    return sum + (q ? q.price * p.quantity : 0);
  }, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.costBasis * p.quantity, 0);
  const totalPnl = totalValue - totalCost;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <label className="text-xs text-slate-400">
          Symbol
          <input
            value={sym}
            onChange={(e) => setSym(e.target.value)}
            placeholder="AAPL"
            className="mt-1 w-24 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="text-xs text-slate-400">
          Quantity
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="100"
            className="mt-1 w-24 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="text-xs text-slate-400">
          Cost / unit (USD)
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="150.00"
            className="mt-1 w-28 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <label className="text-xs text-slate-400">
          Target %
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="20"
            className="mt-1 w-20 rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-amber-400"
          />
        </label>
        <button
          onClick={add}
          className="rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm px-3 py-1.5"
        >
          Add position
        </button>
      </div>

      {positions.length > 0 && (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 bg-slate-900">
                  <th className="px-3 py-2 text-left font-medium">Symbol</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Cost</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Value</th>
                  <th className="px-3 py-2 text-right font-medium">P&amp;L</th>
                  <th className="px-3 py-2 text-right font-medium">Weight</th>
                  <th className="px-3 py-2 text-right font-medium">Target</th>
                  <th className="px-3 py-2 text-right font-medium">Drift</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p, i) => {
                  const q = quotes[p.symbol];
                  const value = q ? q.price * p.quantity : null;
                  const pnl = value !== null ? value - p.costBasis * p.quantity : null;
                  const weight = value !== null && totalValue > 0 ? value / totalValue : null;
                  const drift =
                    weight !== null && p.targetPct != null ? weight - p.targetPct : null;
                  const driftAlert = drift !== null && Math.abs(drift) > DRIFT_ALERT_PP;
                  return (
                    <tr key={`${p.symbol}-${i}`} className="border-t border-slate-800/60">
                      <td className="px-3 py-2">
                        <Link
                          href={`/analyze/${p.symbol}`}
                          className="font-medium text-slate-100 hover:text-amber-300"
                        >
                          {p.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {p.quantity}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                        {fmt(p.costBasis)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {q ? fmt(q.price) : "…"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">
                        {value !== null ? fmt(value) : "…"}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums font-medium ${
                          pnl === null
                            ? "text-slate-600"
                            : pnl >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                        }`}
                      >
                        {pnl !== null ? fmt(pnl) : ""}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-300">
                        {weight !== null ? `${(weight * 100).toFixed(1)}%` : "…"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-400">
                        <input
                          value={p.targetPct != null ? (p.targetPct * 100).toString() : ""}
                          onChange={(e) => {
                            const v = e.target.value.trim();
                            onChange(
                              positions.map((x, j) =>
                                j === i
                                  ? { ...x, targetPct: v === "" ? null : (Number(v) || 0) / 100 }
                                  : x
                              )
                            );
                          }}
                          placeholder="—"
                          className="w-14 text-right rounded bg-slate-800/60 border border-slate-700/60 px-1.5 py-0.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {drift !== null ? (
                          <span
                            className={`text-xs font-medium tabular-nums rounded-full px-2 py-0.5 ${
                              driftAlert
                                ? "bg-amber-400/15 text-amber-300 border border-amber-400/40"
                                : "text-slate-500"
                            }`}
                            title={
                              driftAlert
                                ? "Drifted beyond 5pp from target — consider rebalancing"
                                : "Within tolerance"
                            }
                          >
                            {driftAlert ? "⚠ " : ""}
                            {drift >= 0 ? "+" : ""}
                            {(drift * 100).toFixed(1)}pp
                          </span>
                        ) : (
                          <span className="text-slate-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          onClick={() => onChange(positions.filter((_, j) => j !== i))}
                          className="text-slate-600 hover:text-red-400"
                          aria-label={`Remove ${p.symbol}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-slate-700 bg-slate-900/80 font-medium">
                  <td className="px-3 py-2 text-slate-300" colSpan={4}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-100">
                    {fmt(totalValue)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${
                      totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmt(totalPnl)}
                  </td>
                  <td colSpan={4}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- main manager ---------- */

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [openId, setOpenId] = useState<string | null>(initialClients[0]?.id ?? null);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [screens, setScreens] = useState<Record<string, ScreenResult>>({});
  const [screening, setScreening] = useState<string | null>(null);
  const [extraSymbols, setExtraSymbols] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  // persist with debounce
  useEffect(() => {
    if (clients === initialClients) return;
    // reflect the pending debounced save in the UI
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaveState("saving");
    const t = setTimeout(async () => {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clients),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    }, 700);
    return () => clearTimeout(t);
  }, [clients, initialClients]);

  // fetch quotes for all position symbols
  const refreshQuotes = useCallback(async (cs: Client[]) => {
    const symbols = Array.from(new Set(cs.flatMap((c) => c.positions.map((p) => p.symbol))));
    if (!symbols.length) return;
    const results = await Promise.all(
      symbols.map(async (s) => {
        try {
          const res = await fetch(`/api/quote/${encodeURIComponent(s)}`);
          if (!res.ok) return null;
          const d = (await res.json()) as { price: number; changePercent: number };
          return [s, { price: d.price, changePercent: d.changePercent }] as const;
        } catch {
          return null;
        }
      })
    );
    setQuotes((prev) => {
      const next = { ...prev };
      for (const r of results) if (r) next[r[0]] = r[1];
      return next;
    });
  }, []);

  useEffect(() => {
    // immediate fetch on mount/list change, then poll on an interval
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshQuotes(clients);
    const t = setInterval(() => refreshQuotes(clients), 30_000);
    return () => clearInterval(t);
  }, [clients, refreshQuotes]);

  const update = (id: string, patch: Partial<Client>) =>
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const runScreen = async (id: string) => {
    setScreening(id);
    try {
      const res = await fetch(
        `/api/clients/screen?clientId=${encodeURIComponent(id)}&extra=${encodeURIComponent(extraSymbols)}`
      );
      if (res.ok) {
        const data = (await res.json()) as ScreenResult;
        setScreens((s) => ({ ...s, [id]: data }));
      }
    } finally {
      setScreening(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const c = newClient();
            setClients((cs) => [...cs, c]);
            setOpenId(c.id);
          }}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 text-sm"
        >
          + Add client
        </button>
        <span className="text-xs text-slate-600">
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved" : ""}
        </span>
      </div>

      {clients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-lg font-semibold mb-2">No clients yet</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Add your own book first (call it &ldquo;My Book&rdquo;), set its mandate rules, then add
            client portfolios with theirs.
          </p>
        </div>
      )}

      {clients.map((c) => {
        const open = openId === c.id;
        const screen = screens[c.id];
        return (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
          >
            {/* Card header */}
            <button
              onClick={() => setOpenId(open ? null : c.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-900"
            >
              <div>
                <span className="font-semibold text-slate-100">{c.name || "Unnamed client"}</span>
                <span className="text-xs text-slate-500 ml-3">
                  {c.positions.length} position{c.positions.length === 1 ? "" : "s"}
                </span>
              </div>
              <span className="text-slate-500">{open ? "▾" : "▸"}</span>
            </button>

            {open && (
              <div className="px-5 pb-5 space-y-5 border-t border-slate-800">
                {/* Name & notes */}
                <div className="grid sm:grid-cols-2 gap-3 pt-4">
                  <label className="text-xs text-slate-400">
                    Client name
                    <input
                      value={c.name}
                      onChange={(e) => update(c.id, { name: e.target.value })}
                      placeholder="My Book / Client A"
                      className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Notes
                    <input
                      value={c.notes}
                      onChange={(e) => update(c.id, { notes: e.target.value })}
                      placeholder="Income focus, low leverage tolerance…"
                      className="mt-1 w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    />
                  </label>
                </div>

                {/* Positions */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Positions</h3>
                  <PositionsEditor
                    positions={c.positions}
                    quotes={quotes}
                    onChange={(p) => update(c.id, { positions: p })}
                  />
                </div>

                {/* Risk */}
                {c.positions.length > 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-2">Portfolio risk</h3>
                    <RiskPanel clientId={c.id} />
                  </div>
                )}

                {/* Mandate */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-2">Mandate rules</h3>
                  <MandateEditor
                    mandate={c.mandate}
                    onChange={(m) => update(c.id, { mandate: m })}
                  />
                </div>

                {/* Screen */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      onClick={() => runScreen(c.id)}
                      disabled={screening !== null}
                      className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 text-sm"
                    >
                      {screening === c.id ? "Screening…" : "▶ Run mandate screen"}
                    </button>
                    <input
                      value={extraSymbols}
                      onChange={(e) => setExtraSymbols(e.target.value)}
                      placeholder="Extra symbols to screen (e.g. PEP, MCD)"
                      className="flex-1 min-w-40 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                    />
                  </div>
                  {screening === c.id && (
                    <p className="text-xs text-slate-500 mb-3">
                      Running the full analysis engine over holdings and the screening universe —
                      first run takes a minute; repeat runs are cached.
                    </p>
                  )}

                  {screen && (
                    <div className="space-y-4">
                      {screen.holdings.length > 0 && (
                        <div className="rounded-lg border border-slate-800 overflow-hidden">
                          <h4 className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">
                            Holdings vs mandate
                          </h4>
                          {screen.holdings.map((ev) => (
                            <EvalRow key={ev.symbol} ev={ev} highlight={false} />
                          ))}
                        </div>
                      )}
                      <div className="rounded-lg border border-slate-800 overflow-hidden">
                        <h4 className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900">
                          Opportunities ({screen.opportunities.filter((o) => o.fits).length} fit the
                          mandate)
                        </h4>
                        {screen.opportunities.map((ev) => (
                          <EvalRow key={ev.symbol} ev={ev} highlight={ev.fits} />
                        ))}
                      </div>
                      {screen.unavailable.length > 0 && (
                        <p className="text-xs text-slate-600">
                          Not screenable on the current data plan: {screen.unavailable.join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-slate-600">
                        Screened {new Date(screen.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Danger zone */}
                <button
                  onClick={() => {
                    if (confirm(`Delete ${c.name || "this client"}?`))
                      setClients((cs) => cs.filter((x) => x.id !== c.id));
                  }}
                  className="text-xs text-slate-600 hover:text-red-400"
                >
                  Delete client
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
