import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-lg text-center space-y-4">
        <div className="text-6xl font-black text-amber-400/30">404</div>
        <h1 className="text-2xl font-semibold text-slate-100">Page not found</h1>
        <p className="text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-2.5 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
