import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of all Sunvera Capital analysis modules and quick access links.",
  alternates: { canonical: "https://sunveracapital.com/dashboard" },
};

const MODULES = [
  {
    href: "/",
    icon: "🔍",
    title: "Equity Analysis",
    desc: "Search any company for 100+ ratios, DCF, Altman Z, Piotroski F",
    color: "from-blue-500/10 to-blue-600/5",
  },
  {
    href: "/credit/AAPL",
    icon: "🏦",
    title: "Credit Proposals",
    desc: "Bank-grade credit assessment with DSCR, leverage, risk rating",
    color: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    href: "/scanner",
    icon: "🔎",
    title: "Opportunity Scanner",
    desc: "Screen 30+ tickers for investment signals automatically",
    color: "from-amber-500/10 to-amber-600/5",
  },
  {
    href: "/markets",
    icon: "📈",
    title: "Market Data Hub",
    desc: "Live indices, FX, commodities, sector heatmap, watchlist",
    color: "from-purple-500/10 to-purple-600/5",
  },
  {
    href: "/clients",
    icon: "👥",
    title: "Clients & Mandates",
    desc: "Manage client portfolios, trades, and risk assessments",
    color: "from-rose-500/10 to-rose-600/5",
  },
  {
    href: "/playbooks",
    icon: "📒",
    title: "Trade Playbooks",
    desc: "Import, template, and analyze trade playbooks",
    color: "from-cyan-500/10 to-cyan-600/5",
  },
  {
    href: "/global",
    icon: "🌍",
    title: "Global Market Guide",
    desc: "Country-by-country market data and analysis",
    color: "from-indigo-500/10 to-indigo-600/5",
  },
  {
    href: "/settings",
    icon: "⚙️",
    title: "Settings",
    desc: "Currency, default ticker, and data preferences",
    color: "from-slate-500/10 to-slate-600/5",
  },
];

export default function DashboardPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">Dashboard</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Platform Overview</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className={`card-surface rounded-xl p-5 bg-gradient-to-br ${mod.color} hover:scale-[1.02] transition-transform focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2`}
            >
              <div className="text-2xl mb-3" aria-hidden="true">{mod.icon}</div>
              <h2 className="text-base font-semibold text-slate-100 mb-1">{mod.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
            </Link>
          ))}
        </div>

        {/* Quick search */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-4">Quickly analyze any company:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JPM", "JNJ", "XOM"].map((t) => (
              <Link
                key={t}
                href={`/analyze/${t}`}
                className="text-sm rounded-full border border-slate-700/80 px-4 py-1.5 text-slate-300 hover:border-[#c5a35e] hover:text-[#e0c887] hover:bg-[#c5a35e]/5 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
