import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";
import TickerSearch from "@/components/TickerSearch";
import CurrencyProvider, { CurrencySelect } from "@/components/CurrencyProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sunvera Capital | Institutional Equity & Credit Intelligence",
  description:
    "Institutional-grade equity analysis, credit proposals, and live market data — built on the Sunvera Capital framework.",
  keywords: ["equity analysis", "credit intelligence", "market scanner", "portfolio management", "MENA finance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-slate-100">
        <SessionProvider>
        <CurrencyProvider>
        {/* Skip-to-content link — keyboard accessibility (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-[#c5a35e] focus:text-[#0a0e1a] focus:px-4 focus:py-2.5 focus:font-semibold"
        >
          Skip to main content
        </a>

        {/* Global header */}
        <header className="sticky top-0 z-40 border-b border-[#1e293b]/80 bg-[#0a0e1a]/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group" aria-label="Sunvera Capital home">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c5a35e] to-[#a8851f] flex items-center justify-center text-[#0a0e1a] font-black text-sm gold-glow" aria-hidden="true">
                S
              </span>
              <span className="font-semibold tracking-tight hidden sm:block">
                Sunvera <span className="text-[#c5a35e]">Capital</span>
              </span>
            </Link>

            <div className="flex-1 max-w-md">
              <TickerSearch />
            </div>

            <nav className="flex items-center gap-1 text-sm shrink-0" aria-label="Main navigation">
              <Link
                href="/markets"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">📈</span> <span className="hidden sm:inline">Markets</span>
              </Link>
              <Link
                href="/playbooks"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">📒</span> <span className="hidden sm:inline">Playbooks</span>
              </Link>
              <Link
                href="/clients"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">👥</span> <span className="hidden sm:inline">Clients</span>
              </Link>
              <Link
                href="/scanner"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">🔎</span> <span className="hidden sm:inline">Scanner</span>
              </Link>
              <Link
                href="/global"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">🌍</span> <span className="hidden sm:inline">Global</span>
              </Link>
              <CurrencySelect />
            </nav>
          </div>
        </header>

        <div id="main-content" className="flex-1">{children}</div>

        {/* Global footer */}
        <footer className="border-t border-[#1e293b]/80 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Sunvera Capital Holding LLC</span>
            <span>
              Data: Financial Modeling Prep &amp; Finnhub · Charts: TradingView · Research tool —
              not investment advice
            </span>
          </div>
        </footer>
        </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
