// GET /api/clients/screen?clientId=...&extra=SYM1,SYM2
// Runs the client's mandate over their holdings (compliance) and the
// screening universe + extra symbols (opportunities).

import { NextResponse } from "next/server";
import { loadClients } from "@/lib/clients";
import {
  evaluateMandate,
  DEFAULT_UNIVERSE,
  type SymbolEvaluation,
  type Client,
} from "@/lib/clientTypes";
import { analyzeCompany } from "@/lib/analyze";

async function evaluateSymbol(symbol: string, client: Client): Promise<SymbolEvaluation> {
  try {
    const report = await analyzeCompany(symbol);
    return evaluateMandate(report, client.mandate);
  } catch (err) {
    return {
      symbol: symbol.toUpperCase(),
      companyName: symbol.toUpperCase(),
      sector: "—",
      score: 0,
      rating: "—",
      price: 0,
      checks: [],
      fits: false,
      failedRules: [],
      error: err instanceof Error ? err.message : "Analysis failed",
    };
  }
}

/** Evaluate in small chunks to stay friendly with API rate limits. */
async function evaluateAll(symbols: string[], client: Client): Promise<SymbolEvaluation[]> {
  const results: SymbolEvaluation[] = [];
  const chunkSize = 3;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    results.push(...(await Promise.all(chunk.map((s) => evaluateSymbol(s, client)))));
  }
  return results;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId") || "";
  const extra = (url.searchParams.get("extra") || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const clients = await loadClients();
  const client = clients.find((c) => c.id === clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const holdingSymbols = Array.from(new Set(client.positions.map((p) => p.symbol.toUpperCase())));
  const candidateSymbols = Array.from(new Set([...DEFAULT_UNIVERSE, ...extra])).filter(
    (s) => !holdingSymbols.includes(s)
  );

  const [holdings, candidates] = [
    await evaluateAll(holdingSymbols, client),
    await evaluateAll(candidateSymbols, client),
  ];

  return NextResponse.json({
    clientId,
    generatedAt: new Date().toISOString(),
    holdings,
    opportunities: candidates
      .filter((c) => !c.error)
      .sort((a, b) => Number(b.fits) - Number(a.fits) || b.score - a.score),
    unavailable: candidates.filter((c) => c.error).map((c) => c.symbol),
  });
}
