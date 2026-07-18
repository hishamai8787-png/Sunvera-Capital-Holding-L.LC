import { NextResponse } from "next/server";
import { runScan, loadLastScan } from "@/lib/scanner";
import { sanitizeString } from "@/lib/validation";
import { rateLimitResponse, SCANNER_LIMIT } from "@/lib/rateLimit";

export const revalidate = 600; // 10 minutes

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "scan-get");
  if (rl) return rl;
  const last = await loadLastScan();
  return NextResponse.json(
    last ?? { generatedAt: null, opportunities: [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    }
  );
}

export async function POST(req: Request) {
  const rl = await rateLimitResponse(req, "scan-run", SCANNER_LIMIT);
  if (rl) return rl;

  let extra: string[] = [];
  try {
    const body = await req.json() as { extra?: string };
    const cleaned = sanitizeString(body.extra ?? "", 200);
    extra = cleaned
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 10);
  } catch {
    // empty body is fine
  }

  try {
    const results = await runScan(extra);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[scan] Error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Scan failed. Please try again later." },
      { status: 500 }
    );
  }
}
