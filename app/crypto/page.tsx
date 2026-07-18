import AssetGrid from "@/components/AssetGrid";
import HistoryChart from "@/components/HistoryChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto — Digital Asset Prices & Charts",
  description: "Live cryptocurrency prices for Bitcoin, Ethereum, and top altcoins with historical comparison charts.",
  alternates: { canonical: "https://sunveracapital.com/crypto" },
};

export default function CryptoPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>
        <h1 className="text-2xl font-semibold mb-1">Cryptocurrency</h1>
        <p className="text-sm text-slate-400 mb-6">Live prices for major cryptocurrencies and altcoins. Updates every 60 seconds.</p>

        <AssetGrid type="crypto" hideHeader />
        <HistoryChart category="crypto" />
      </div>
    </main>
  );
}
