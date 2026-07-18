import AssetGrid from "@/components/AssetGrid";
import { SITE_URL } from "@/lib/siteConfig";
import HistoryChart from "@/components/HistoryChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bonds — Sovereign Yields & Historical Charts",
  description: "Live government bond yields for US Treasuries and international sovereign debt with historical comparison.",
  alternates: { canonical: `${SITE_URL}/bonds` },
};

export default function BondsPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>
        <h1 className="text-2xl font-semibold mb-1">Sovereign Bond Yields</h1>
        <p className="text-sm text-slate-400 mb-6">Live government bond yields across US Treasuries and international sovereigns. Updates every 60 seconds.</p>

        <AssetGrid type="bonds" hideHeader />
        <HistoryChart category="bonds" />
      </div>
    </main>
  );
}
