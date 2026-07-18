"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function FeedbackWidget() {
  const addToast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("improvement");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) return;
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message, page: window.location.pathname }),
      });
      const data = await res.json();
      if (res.ok) {
        addToast("Thank you! Your feedback was sent.", "success");
        setMessage("");
        setOpen(false);
      } else {
        addToast(data.error || "Failed to send feedback.", "error");
      }
    } catch {
      addToast("Failed to send feedback.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-[#c5a35e] to-[#a8851f] text-[#0a0e1a] font-bold text-xl shadow-lg hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
      >
        <span aria-hidden="true">!</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-3" role="dialog" aria-label="Send feedback">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Send Feedback</h3>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close feedback form"
          className="text-slate-400 hover:text-slate-200 min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          ✕
        </button>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Feedback type"
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#c5a35e]"
        >
          <option value="improvement">Improvement suggestion</option>
          <option value="bug">Bug report</option>
          <option value="feature">Feature request</option>
          <option value="other">Other</option>
        </select>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you think..."
          aria-label="Feedback message"
          rows={4}
          maxLength={2000}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-[#c5a35e] resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">{message.length}/2000</span>
          <button
            type="submit"
            disabled={busy || message.trim().length < 5}
            aria-busy={busy}
            className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] disabled:opacity-50 text-[#0a0e1a] font-semibold px-4 py-2 text-sm transition-opacity"
          >
            {busy ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
