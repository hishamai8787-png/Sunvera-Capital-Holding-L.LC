"use client";

// Trade history import controls: upload xlsx/csv, download template,
// load sample data, clear data.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function TradeImport({ hasData }: { hasData: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const upload = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/playbooks/import", { method: "POST", body: form });
      const data = (await res.json()) as { imported?: number; warnings?: string[]; error?: string };
      if (!res.ok || data.error) {
        setMessage({ kind: "err", text: data.error ?? "Import failed." });
      } else {
        setMessage({
          kind: "ok",
          text: `Imported ${data.imported} trades.${data.warnings?.length ? ` ${data.warnings.join(" ")}` : ""}`,
        });
        router.refresh();
      }
    } catch {
      setMessage({ kind: "err", text: "Import failed — check the file and try again." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const loadSample = async () => {
    setBusy(true);
    setMessage(null);
    await fetch("/api/playbooks/sample", { method: "POST" });
    setMessage({ kind: "ok", text: "Sample dataset loaded — explore, then import your own." });
    setBusy(false);
    router.refresh();
  };

  const clearAll = async () => {
    if (!confirm("Remove all trade data from the playbook module?")) return;
    setBusy(true);
    await fetch("/api/playbooks/sample", { method: "DELETE" });
    setMessage(null);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 text-sm transition-colors"
        >
          {busy ? "Working…" : "⬆ Import Excel / CSV"}
        </button>
        <a
          href="/api/playbooks/template"
          className="rounded-lg border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 px-4 py-2 text-sm transition-colors"
        >
          ⬇ Download template
        </a>
        {!hasData && (
          <button
            onClick={loadSample}
            disabled={busy}
            className="rounded-lg border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            ✨ Load sample data
          </button>
        )}
        {hasData && (
          <button
            onClick={clearAll}
            disabled={busy}
            className="rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-400/50 px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            Clear data
          </button>
        )}
      </div>
      {message && (
        <p className={`text-sm ${message.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
