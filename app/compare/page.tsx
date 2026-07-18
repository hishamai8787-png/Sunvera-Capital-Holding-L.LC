import CompareClient from "./CompareClient";
import { SITE_URL } from "@/lib/siteConfig";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Companies — Side-by-Side Analysis",
  description: "Compare up to 5 companies across 15 financial metrics.",
  alternates: { canonical: `${SITE_URL}/compare` },
};

export default function ComparePage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e] mb-2">Sunvera Capital</p>
        <h1 className="text-2xl font-semibold mb-1">Company Comparison</h1>
        <p className="text-sm text-slate-400 mb-6">Compare up to 5 companies across 15 financial metrics.</p>
        <CompareClient />
      </div>
    </main>
  );
}
