import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Sunvera Capital",
  description:
    "Sunvera Capital Holding LLC — institutional-grade equity analysis, credit proposals, and live market data for professional investors.",
  alternates: { canonical: "https://sunveracapital.com/about" },
};

const VALUES = [
  {
    icon: "🎯",
    title: "Institutional Rigor",
    desc: "Every metric, ratio, and score follows published methodologies — Altman Z-Score, Piotroski F-Score, Graham-style valuation. No black boxes.",
  },
  {
    icon: "⚡",
    title: "Speed to Insight",
    desc: "100+ financial ratios, DCF fair value, and a full credit proposal in seconds — not hours of spreadsheet work.",
  },
  {
    icon: "🔒",
    title: "Security First",
    desc: "Row-level security, bcrypt password hashing, rate limiting, CSP headers, and sanitized error handling — built to institutional standards.",
  },
  {
    icon: "🌐",
    title: "MENA Expertise",
    desc: "Financial-sector mandate evaluation, Sharia-compliance screening, and regional market data — built for Gulf and MENA investors.",
  },
];

const STATS = [
  { value: "100+", label: "Financial Ratios" },
  { value: "30+", label: "Scanned Tickers" },
  { value: "9", label: "Analysis Modules" },
  { value: "38", label: "Automated Tests" },
];

export default function AboutPage() {
  return (
    <main className="text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#c5a35e]/8 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">About Us</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">
            Research like an institution
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Sunvera Capital Holding LLC builds professional-grade financial analysis tools
            that bring institutional-quality equity research, credit assessment, and market
            intelligence to your screen — in seconds, not hours.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="card-surface rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-[#c5a35e]">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-8 text-center">What We Stand For</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="card-surface rounded-xl p-6">
              <div className="text-3xl mb-3" aria-hidden="true">{v.icon}</div>
              <h3 className="text-lg font-semibold text-[#e0c887] mb-2">{v.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to dive in?</h2>
        <p className="text-slate-400 mb-8">Start researching any company instantly — no signup required.</p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-8 py-3 transition-all"
        >
          Start Researching
        </Link>
      </section>
    </main>
  );
}
