"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-lg text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-semibold text-slate-100">Something went wrong</h1>
        <p className="text-slate-400">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-700 hover:border-amber-400 text-slate-200 font-semibold px-6 py-2.5 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
