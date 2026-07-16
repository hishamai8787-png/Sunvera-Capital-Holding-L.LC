import { NextResponse } from "next/server";
import { runScan, loadLastScan } from "@/lib/scanner";
import { sanitizeString } from "@/lib/validation";
import { rateLimitResponse, SCANNER_LIMIT } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const rl = rateLimitResponse(req, "scan-get");
  if (rl) return rl;
  const last = await loadLastScan();
  return NextResponse.json(last ?? { generatedAt: null, opportunities: [] });
}

export async function POST(req: Request) {
  const rl = rateLimitResponse(req, "scan-run", SCANNER_LIMIT);
  if (rl) return rl;

  let extra: string[] = [];
  try {
    const body = await req.json() as { extra?: string };
    const cleaned = sanitizeString(body.extra ?? "", 200);
    extra = cleaned.split(",").map(s => s.trim()).filter(Boolean);
  } catch {}
  try {
    const result = await runScan(extra);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
