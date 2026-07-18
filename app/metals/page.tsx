import AssetGrid from "@/components/AssetGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precious Metals & Minerals",
  description: "Live prices for gold, silver, platinum, palladium, copper, and industrial minerals.",
  alternates: { canonical: "https://sunveracapital.com/metals" },
};

export default function MetalsPage() {
  return <AssetGrid type="metals" title="Precious Metals & Minerals" subtitle="Live spot prices for precious metals, industrial minerals, and energy commodities. Updates every 60 seconds." />;
}
