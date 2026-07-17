import { loadClients } from "@/lib/clients";
import ClientsManager from "@/components/ClientsManager";

export const metadata = { title: "Clients — Sunvera Capital" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await loadClients();

  return (
    <main className="text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/40 p-5">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c5a35e]">Sunvera Capital</p>
          <h1 className="text-2xl font-semibold mt-0.5">Clients &amp; Mandates</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Each portfolio gets a mandate — score floors, valuation ceilings, leverage limits,
            sector rules. Run a screen to see which holdings still comply and which new ideas fit
            the mandate <em>before the client asks</em>.
          </p>
        </div>

        <ClientsManager initialClients={clients} />
      </div>
    </main>
  );
}
