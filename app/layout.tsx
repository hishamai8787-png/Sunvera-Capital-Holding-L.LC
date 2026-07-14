import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Sunvera Analyst",
  description:
    "Institutional-style equity analysis, credit proposals, and live market data — built on the Sunvera Capital framework.",
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
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <CurrencyProvider>
        {/* Global header */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20">
                S
              </span>
              <span className="font-semibold tracking-tight hidden sm:block">
                Sunvera <span className="text-amber-400">Analyst</span>
              </span>
            </Link>

            <div className="flex-1 max-w-md">
              <TickerSearch />
            </div>

            <nav className="flex items-center gap-1 text-sm shrink-0">
              <Link
                href="/markets"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              >
                📈 <span className="hidden sm:inline">Markets</span>
              </Link>
              <Link
                href="/playbooks"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              >
                📒 <span className="hidden sm:inline">Playbooks</span>
              </Link>
              <Link
                href="/clients"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              >
                👥 <span className="hidden sm:inline">Clients</span>
              </Link>
              <Link
                href="/scanner"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              >
                🔎 <span className="hidden sm:inline">Scanner</span>
              </Link>
              <Link
                href="/global"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              >
                🌍 <span className="hidden sm:inline">Global</span>
              </Link>
              <CurrencySelect />
            </nav>
          </div>
        </header>

        <div className="flex-1">{children}</div>

        {/* Global footer */}
        <footer className="border-t border-slate-800/80 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span>Sunvera Capital · Analyst</span>
            <span>
              Data: Financial Modeling Prep &amp; Finnhub · Charts: TradingView · Research tool —
              not investment advice
            </span>
          </div>
        </footer>
        </CurrencyProvider>
      </body>
    </html>
  );
}
