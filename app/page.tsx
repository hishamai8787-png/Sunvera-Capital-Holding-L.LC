import Link from "next/link";
import TickerSearch from "@/components/TickerSearch";
import type { Metadata } from "next";

const EXAMPLES = ["AAPL", "MSFT", "NKE", "JNJ", "KO", "GOOGL"];

const MODULES = [
  {
    href: "/analyze/AAPL",
    icon: "📊",
    title: "Equity Analysis",
    desc: "100+ ratios, Altman Z, Piotroski F, DCF fair value, and a flowing narrative that links every number — scored 0–100 on your framework.",
    cta: "Try with Apple",
  },
  {
    href: "/credit/AAPL",
    icon: "🏦",
    title: "Credit Proposals",
    desc: "Bank-grade credit assessment: DSCR, leverage, pro-forma facility impact, peer benchmarks, risk rating, and a Word document ready for committee.",
    cta: "Draft a proposal",
  },
  {
    href: "/markets",
    icon: "📈",
    title: "Market Data Hub",
    desc: "Live indices, bonds, FX and commodities, a real-time watchlist, sector heatmap, and streaming market news — all in one screen.",
    cta: "Open the hub",
  },
];

export const metadata: Metadata = {
  title: "Sunvera Capital | Institutional Equity & Credit Intelligence",
  description:
    "Research any company like an institution — 100+ financial ratios, Altman Z-Score, Piotroski F-Score, DCF fair value, bank-grade credit proposals, and live market data in seconds.",
  alternates: { canonical: "https://sunveracapital.com" },
};

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#c5a35e]/8 blur-3xl"
      />

      <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">
          Sunvera Capital
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
          Research any company
          <span className="block text-slate-400 text-2xl sm:text-3xl font-normal mt-2">
            like an institution — in seconds
          </span>
        </h1>

        <div className="max-w-xl mx-auto mt-8">
          <TickerSearch size="lg" autoFocus placeholder="Try \"Apple\", \"Microsoft\", or a ticker…" />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Example tickers">
          {EXAMPLES.map((t) => (
            <Link
              key={t}
              href={`/analyze/${t}`}
              aria-label={`Analyze ${t}`}
              className="text-sm rounded-full border border-slate-700/80 px-4 py-1.5 text-slate-300 hover:border-[#c5a35e] hover:text-[#e0c887] hover:bg-[#c5a35e]/5 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
            >
              {t}
            </Link>
          ))}
        </div>

        {/* Module cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-16 text-left">
          {MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              aria-label={`${mod.title}: ${mod.cta}`}
              className="group card-surface p-6 hover:border-[#c5a35e]/40 hover:shadow-lg hover:shadow-[#c5a35e]/5 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
            >
              <div className="text-3xl mb-3" aria-hidden="true">{mod.icon}</div>
              <h2 className="font-semibold text-slate-100 mb-2">{mod.title}</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{mod.desc}</p>
              <span className="text-sm text-[#c5a35e] group-hover:text-[#e0c887]">
                {mod.cta} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
