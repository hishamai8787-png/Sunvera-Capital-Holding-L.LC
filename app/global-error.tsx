"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html>
      <body className="bg-[#0a0e1a] text-slate-100 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-semibold">Application Error</h1>
          <p className="text-slate-400">
            A critical error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-6 py-2.5 transition-all"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
