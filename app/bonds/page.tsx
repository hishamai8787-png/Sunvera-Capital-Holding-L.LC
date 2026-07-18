import AssetGrid from "@/components/AssetGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bonds — Sovereign Yields",
  description: "Live government bond yields for US Treasuries and international sovereign debt.",
  alternates: { canonical: "https://sunveracapital.com/bonds" },
};

export default function BondsPage() {
  return <AssetGrid type="bonds" title="Sovereign Bond Yields" subtitle="Live government bond yields across US Treasuries and international sovereigns. Updates every 60 seconds." />;
}
