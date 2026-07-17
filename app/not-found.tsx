import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-lg text-center space-y-4">
        <div className="text-7xl font-black text-[#c5a35e]/20">404</div>
        <h1 className="text-2xl font-semibold text-slate-100">Page not found</h1>
        <p className="text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-6 py-2.5 transition-all"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
