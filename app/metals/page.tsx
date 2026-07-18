import AssetGrid from "@/components/AssetGrid";
import HistoryChart from "@/components/HistoryChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precious Metals & Minerals — Live Prices & Charts",
  description: "Live prices for gold, silver, platinum, palladium, copper, and industrial minerals with historical comparison.",
  alternates: { canonical: "https://sunveracapital.com/metals" },
};

export default function MetalsPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>
        <h1 className="text-2xl font-semibold mb-1">Precious Metals & Minerals</h1>
        <p className="text-sm text-slate-400 mb-6">Live spot prices for precious metals, industrial minerals, and energy commodities. Updates every 60 seconds.</p>

        <AssetGrid type="metals" hideHeader />
        <HistoryChart category="metals" />
      </div>
    </main>
  );
}
