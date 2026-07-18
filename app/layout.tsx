import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Providers from "./Providers";
import TickerSearch from "@/components/TickerSearch";
import CurrencyProvider, { CurrencySelect } from "@/components/CurrencyProvider";
import MobileNav from "@/components/MobileNav";
import { ToastProvider } from "@/components/Toast";
import SocialLinks from "@/components/SocialLinks";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://sunveracapital.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sunvera Capital | Institutional Equity & Credit Intelligence",
    template: "%s | Sunvera Capital",
  },
  description:
    "Institutional-grade equity analysis, credit proposals, and live market data — 100+ ratios, Altman Z, Piotroski F, DCF fair value, and bank-grade credit assessments with Word document export.",
  keywords: [
    "equity analysis",
    "credit intelligence",
    "credit proposal",
    "market scanner",
    "portfolio management",
    "DCF valuation",
    "Altman Z-Score",
    "Piotroski F-Score",
    "MENA finance",
    "institutional research",
    "financial analysis platform",
    "Sunvera Capital",
  ],
  authors: [{ name: "Sunvera Capital Holding LLC" }],
  creator: "Sunvera Capital Holding LLC",
  publisher: "Sunvera Capital Holding LLC",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Sunvera Capital",
    title: "Sunvera Capital | Institutional Equity & Credit Intelligence",
    description:
      "Research any company like an institution — 100+ ratios, DCF fair value, bank-grade credit proposals, and live market data in seconds.",
    images: [
      {
        url: "https://media.base44.com/images/public/6a58633ccc2190d9113b4aaa/b9c4cd9b6_generated_image.png",
        width: 1200,
        height: 630,
        alt: "Sunvera Capital — Institutional Research Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sunvera Capital | Institutional Equity & Credit Intelligence",
    description:
      "Research any company like an institution — 100+ ratios, DCF, credit proposals, and live market data in seconds.",
    images: [
      "https://media.base44.com/images/public/6a58633ccc2190d9113b4aaa/b9c4cd9b6_generated_image.png",
    ],
  },
  icons: {
    icon: "/favicon.ico",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "finance",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sunvera Capital Holding LLC",
  description:
    "Institutional-grade equity analysis, credit proposals, and live market data platform.",
  url: siteUrl,
  founder: {
    "@type": "Person",
    name: "Hisham Al-Sayed",
    jobTitle: "Founder & CIO",
  },
  knowsAbout: [
    "Equity Analysis",
    "Credit Intelligence",
    "DCF Valuation",
    "Altman Z-Score",
    "Piotroski F-Score",
    "Portfolio Management",
    "MENA Finance",
  ],
  sameAs: [
    "https://twitter.com/SunveraCapital",
    "https://linkedin.com/company/sunvera-capital",
    "https://instagram.com/sunveracapital",
    "https://facebook.com/sunveracapital",
    "https://youtube.com/@sunveracapital",
    "https://t.me/sunveracapital",
  ],
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Sunvera Capital",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Institutional-grade equity analysis, credit proposals, and live market data — 100+ ratios, DCF fair value, and bank-grade credit assessments.",
  url: siteUrl,
  publisher: {
    "@type": "Organization",
    name: "Sunvera Capital Holding LLC",
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0e1a] text-slate-100">
        <Providers>
        <ToastProvider>
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

              <Link
                href="/compare"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">⚖️</span> <span className="hidden sm:inline">Compare</span>
              </Link>
              <Link
                href="/forex"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">💱</span> <span className="hidden sm:inline">Forex</span>
              </Link>
              <Link
                href="/crypto"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">₿</span> <span className="hidden sm:inline">Crypto</span>
              </Link>
              <Link
                href="/metals"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">🥇</span> <span className="hidden sm:inline">Metals</span>
              </Link>
              <Link
                href="/bonds"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-[#e0c887] hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">📜</span> <span className="hidden sm:inline">Bonds</span>
              </Link>
              <CurrencySelect />
              <MobileNav />
            </nav>
          </div>
        </header>

        <div id="main-content" className="flex-1">{children}</div>

        {/* Global footer */}
        <footer className="border-t border-[#1e293b]/80 py-8">
          <div className="max-w-7xl mx-auto px-6 space-y-6">
            {/* Top row: brand + social */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c5a35e] to-[#a8851f] flex items-center justify-center text-[#0a0e1a] font-black text-xs" aria-hidden="true">S</span>
                <span className="font-semibold text-sm">Sunvera <span className="text-[#c5a35e]">Capital</span></span>
              </div>
              <SocialLinks variant="footer" />
            </div>

            {/* Middle row: nav links */}
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500" aria-label="Footer navigation">
              <Link href="/about" className="hover:text-[#c5a35e] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[#c5a35e] transition-colors">Contact</Link>
              <Link href="/markets" className="hover:text-[#c5a35e] transition-colors">Markets</Link>
              <Link href="/scanner" className="hover:text-[#c5a35e] transition-colors">Scanner</Link>
              <Link href="/forex" className="hover:text-[#c5a35e] transition-colors">Forex</Link>
              <Link href="/crypto" className="hover:text-[#c5a35e] transition-colors">Crypto</Link>
              <Link href="/metals" className="hover:text-[#c5a35e] transition-colors">Metals</Link>
              <Link href="/bonds" className="hover:text-[#c5a35e] transition-colors">Bonds</Link>
              <Link href="/terms" className="hover:text-[#c5a35e] transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-[#c5a35e] transition-colors">Privacy Policy</Link>
            </nav>

            {/* Bottom row: copyright */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-[#1e293b]/60 pt-4">
              <span>© {new Date().getFullYear()} Sunvera Capital Holding LLC. All rights reserved.</span>
              <span>
                Data: FMP &amp; Finnhub · Charts: TradingView · Research tool — not investment advice
              </span>
            </div>
          </div>
        </footer>
        </CurrencyProvider>
        </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
