import GlobalGuide from "@/components/GlobalGuide";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Global Market Guide",
  description:
    "How to enter each market — brokers, required documents, individual vs entity structures, cross-border tax comparison and optimization ideas.",
  alternates: { canonical: "https://sunveracapital.com/global" },
};

export default function GlobalPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="card-surface bg-gradient-to-r from-slate-900 to-slate-900/40 p-5">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e]">Sunvera Capital</p>
          <h1 className="text-2xl font-semibold mt-0.5">Global Market Guide</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            How to enter each market — brokers, required documents and how to get them, individual
            vs entity structures — plus a cross-border tax comparison with optimization ideas for
            your residency.
          </p>
        </div>

        <GlobalGuide />
      </div>
    </main>
  );
}
