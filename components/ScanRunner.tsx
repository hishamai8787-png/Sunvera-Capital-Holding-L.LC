"use client";

// Scanner controls — run a scan (optionally with extra symbols), refresh page on completion.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanRunner({ lastRun }: { lastRun: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
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
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={run}
          disabled={busy}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 text-sm"
        >
          {busy ? "Scanning…" : "🔎 Run scan"}
        </button>
        <input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Extra symbols (e.g. PEP, ADBE)"
          className="flex-1 min-w-44 max-w-xs rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
        />
        {lastRun && (
          <span className="text-xs text-slate-500">
            Last scan: {new Date(lastRun).toLocaleString()}
          </span>
        )}
      </div>
      {busy && (
        <p className="text-xs text-slate-500 mt-2">
          Analyzing ~30 companies through the full engine — first run takes a few minutes; repeats
          within the hour are cached and fast.
        </p>
      )}
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
