import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { validateTicker } from "@/lib/validation";

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "search");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const validated = validateTicker(query);
  if (!validated) {
    return NextResponse.json(
      { error: "Invalid search query. Use 1-6 uppercase letters." },
      { status: 400 }
    );
  }
  return NextResponse.json({ symbol: validated });
}
