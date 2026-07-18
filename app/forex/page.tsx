import AssetGrid from "@/components/AssetGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forex — Live Currency Rates",
  description: "Real-time forex rates for major, minor, emerging market, and Gulf currency pairs.",
  alternates: { canonical: "https://sunveracapital.com/forex" },
};

export default function ForexPage() {
  return <AssetGrid type="forex" title="Foreign Exchange" subtitle="Live FX rates across major, minor, emerging, and Gulf currency pairs. Updates every 60 seconds." />;
}
