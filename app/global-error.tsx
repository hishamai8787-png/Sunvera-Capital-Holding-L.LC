"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-2xl font-semibold">Application Error</h1>
          <p className="text-slate-400">
            {error.message || "A critical error occurred."}
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
