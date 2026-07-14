// GET /api/clients/risk?clientId=...&candidate=SYM&weight=5
// Portfolio volatility/correlation report with optional candidate what-if.

import { NextResponse } from "next/server";
import { loadClients } from "@/lib/clients";
import { buildRiskReport } from "@/lib/risk";
import { getQuote } from "@/lib/fmp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || "";
  const candidate = (url.searchParams.get("candidate") || "").trim().toUpperCase() || null;
  const weightPct = Number(url.searchParams.get("weight") || 5);

  const clients = await loadClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
  if (!client.positions.length) {
    return NextResponse.json(
      { error: "Add positions to this client before running risk analysis." },
      { status: 400 }
    );
  }

  // market values from live quotes (falls back to cost basis)
  const symbols = Array.from(new Set(client.positions.map((p) => p.symbol.toUpperCase())));
  const marketValues: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (s) => {
      const qty = client.positions
        .filter((p) => p.symbol.toUpperCase() === s)
        .reduce((sum, p) => sum + p.quantity, 0);
      try {
        const q = await getQuote(s);
        marketValues[s] = q.price * qty;
      } catch {
        const cost = client.positions
          .filter((p) => p.symbol.toUpperCase() === s)
          .reduce((sum, p) => sum + p.costBasis * p.quantity, 0);
        marketValues[s] = cost;
      }
    })
  );

  const report = await buildRiskReport(
    client.positions,
    marketValues,
    candidate,
    (isFinite(weightPct) ? weightPct : 5) / 100
  );
  return NextResponse.json(report);
}
