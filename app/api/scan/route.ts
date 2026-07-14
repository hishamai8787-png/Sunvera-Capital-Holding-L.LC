// POST /api/scan — run the opportunity scanner (body: { extra?: string }).
// GET /api/scan — return the last saved scan.

import { NextResponse } from "next/server";
import { runScan, loadLastScan } from "@/lib/scanner";

export async function GET() {
  const last = await loadLastScan();
  return NextResponse.json(last ?? { generatedAt: null, opportunities: [] });
}

export async function POST(req: Request) {
  let extra: string[] = [];
  try {
    const body = (await req.json()) as { extra?: string };
    extra = (body.extra ?? "").split(",");
  } catch {
    // no body — scan the default universe
  }
  try {
    const result = await runScan(extra);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
