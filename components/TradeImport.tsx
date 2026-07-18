"use client";

// Trade history import controls: upload xlsx/csv, download template,
// load sample data, clear data.
// Now with file validation (M9).

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export default function TradeImport({ hasData }: { hasData: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const validateFile = (file: File): string | null => {
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    if (!VALID_EXTENSIONS.includes(ext)) {
      return `Invalid file type. Use ${VALID_EXTENSIONS.join(", ")}.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum 10MB.";
    }
    if (file.size === 0) {
      return "File is empty.";
    }
    return null;
  };

  const upload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setMessage({ kind: "err", text: validationError });
      return;
    }
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
          aria-busy={busy}
          className="rounded-lg bg-[#c5a35e] hover:bg-[#d4b06e] disabled:opacity-50 text-[#0a0e1a] font-semibold px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
        >
          {busy ? "Working…" : (<><span aria-hidden="true">⬆</span> Import Excel / CSV</>)}
        </button>
        <a
          href="/api/playbooks/template"
          className="rounded-lg border border-slate-700 hover:border-[#c5a35e] text-slate-300 hover:text-[#e0c887] px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
        >
          <span aria-hidden="true">⬇</span> Download template
        </a>
        {!hasData && (
          <button
            onClick={loadSample}
            disabled={busy}
            className="rounded-lg border border-slate-700 hover:border-[#c5a35e] text-slate-300 hover:text-[#e0c887] px-4 py-2 text-sm transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
          >
            <span aria-hidden="true">✨</span> Load sample data
          </button>
        )}
        {hasData && (
          <button
            onClick={clearAll}
            disabled={busy}
            className="rounded-lg border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-400/50 px-4 py-2 text-sm transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
          >
            Clear data
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Supports .xlsx, .xls, .csv up to 10MB. Use the template for the correct format.
      </p>
      {message && (
        <p
          className={`text-sm ${message.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
          role={message.kind === "err" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
