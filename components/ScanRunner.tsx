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
        {lastRun && (
          <span className="text-xs text-slate-400">
            Last scan: {new Date(lastRun).toLocaleString()}
          </span>
        )}
      </div>
      <div aria-live="polite">
        {busy && (
          <p className="text-xs text-slate-400 mt-2">
            Analyzing ~30 companies through the full engine — first run takes a few minutes; repeats
            within the hour are cached and fast.
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-2" role="alert">{error}</p>}
      </div>
    </div>
  );
}
