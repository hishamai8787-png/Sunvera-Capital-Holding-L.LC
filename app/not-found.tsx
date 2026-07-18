import Link from "next/link";

const SUGGESTED = [
  { href: "/", icon: "🔍", label: "Search a company" },
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/markets", icon: "📈", label: "Markets" },
  { href: "/scanner", icon: "🔎", label: "Scanner" },
];

export default function NotFound() {
  return (
    <main className="flex items-center justify-center min-h-[60vh] px-6 py-16">
      <div className="max-w-lg text-center space-y-6">
        <div className="text-7xl font-black text-[#c5a35e]/20" aria-hidden="true">404</div>
        <h1 className="text-2xl font-semibold text-slate-100">Page not found</h1>
        <p className="text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-1.5 text-sm rounded-lg border border-slate-700/80 px-4 py-2 text-slate-300 hover:border-[#c5a35e] hover:text-[#e0c887] hover:bg-[#c5a35e]/5 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
            >
              <span aria-hidden="true">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </div>
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
