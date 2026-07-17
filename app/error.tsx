"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <main className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-lg text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-semibold text-slate-100">Something went wrong</h1>
        <p className="text-slate-400">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-6 py-2.5 transition-all"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 hover:border-[#c5a35e] text-slate-200 font-semibold px-6 py-2.5 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
