import AssetGrid from "@/components/AssetGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto — Digital Asset Prices",
  description: "Live cryptocurrency prices for Bitcoin, Ethereum, and top altcoins.",
  alternates: { canonical: "https://sunveracapital.com/crypto" },
};

export default function CryptoPage() {
  return <AssetGrid type="crypto" title="Cryptocurrency" subtitle="Live prices for major cryptocurrencies and altcoins. Updates every 60 seconds." />;
}
