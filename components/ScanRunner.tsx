"use client";

// Scanner controls — run a scan (optionally with extra symbols), refresh page on completion.
// Now with progress feedback showing scan stages.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  { label: "Fetching company profiles", icon: "📋" },
  { label: "Pulling financial statements", icon: "📊" },
  { label: "Calculating 100+ ratios", icon: "🧮" },
  { label: "Running Altman Z & Piotroski F", icon: "🔬" },
  { label: "Scoring & ranking opportunities", icon: "🏆" },
];

export default function ScanRunner({ lastRun }: { lastRun: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stageRef.current) clearInterval(stageRef.current);
    timerRef.current = null;
    stageRef.current = null;
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    setStage(0);
    setElapsed(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    let currentStage = 0;
    stageRef.current = setInterval(() => {
      currentStage = Math.min(currentStage + 1, STAGES.length - 1);
      setStage(currentStage);
    }, 5000);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extra }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Scan failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Scan failed — try again.");
    } finally {
      cleanup();
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={busy}
          aria-busy={busy}
          className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] disabled:opacity-50 text-[#0a0e1a] font-semibold px-4 py-2 text-sm transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
        >
          {busy ? "Scanning…" : (<><span aria-hidden="true">🔎</span> Run scan</>)}
        </button>
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Extra symbols (e.g. PEP, ADBE)"
          aria-label="Extra ticker symbols to include in scan"
          className="flex-1 min-w-44 max-w-xs rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-1 focus-visible:outline-[#c5a35e]"
        />
        {lastRun && !busy && (
          <span className="text-xs text-slate-400">
            Last scan: {new Date(lastRun).toLocaleString()}
          </span>
        )}
      </div>
      <div aria-live="polite">
        {busy && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Elapsed: {elapsed}s</span>
              <span>Stage {stage + 1} of {STAGES.length}</span>
            </div>
            <div className="space-y-1.5">
              {STAGES.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm transition-opacity ${
                    i <= stage ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <span aria-hidden="true" className="text-base">
                    {i < stage ? "✅" : i === stage ? "⏳" : s.icon}
                  </span>
                  <span className={i === stage ? "text-[#c5a35e] font-medium" : "text-slate-300"}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c5a35e] to-[#a8851f] transition-all duration-500"
                style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={stage + 1}
                aria-valuemin={1}
                aria-valuemax={STAGES.length}
              />
            </div>
          </div>
        )}
        {!busy && !error && (
          <p className="text-xs text-slate-400 mt-2">
            Analyzes ~30 companies through the full engine — first run takes a few minutes; repeats
            within the hour are cached and fast.
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-2" role="alert">{error}</p>}
      </div>
    </div>
  );
}
