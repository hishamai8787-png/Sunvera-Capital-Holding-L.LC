import { NextResponse } from "next/server";
import { searchTicker } from "@/lib/fmp";
import { sanitizeString } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

export const revalidate = 3600; // 1 hour

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "search");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const query = sanitizeString(searchParams.get("q") ?? "", 100);

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTicker(query);
    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Search unavailable" }, { status: 502 });
  }
}
