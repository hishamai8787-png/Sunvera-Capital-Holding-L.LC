import AssetGrid from "@/components/AssetGrid";
import ForexConverter from "@/components/ForexConverter";
import HistoryChart from "@/components/HistoryChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex — Live Currency Rates & Converter",
  description: "Real-time forex rates for major, minor, emerging market, and Gulf currency pairs with live converter and historical charts.",
  alternates: { canonical: "https://sunveracapital.com/forex" },
};

export default function ForexPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>
        <h1 className="text-2xl font-semibold mb-1">Foreign Exchange</h1>
        <p className="text-sm text-slate-400 mb-6">Live FX rates across major, minor, emerging, and Gulf currency pairs. Updates every 60 seconds.</p>

        <AssetGrid type="forex" title="" subtitle="" />

        {/* Forex Converter */}
        <div className="mt-8">
          <ForexConverter />
        </div>

        {/* Historical Comparison Chart */}
        <HistoryChart category="forex" />
      </div>
    </main>
  );
}
