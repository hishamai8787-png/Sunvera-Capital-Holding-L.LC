import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "news");
  if (rl) return rl;

  const { searchParams } = new URL(req.url);
  const category = sanitizeString(searchParams.get("category") ?? "general", 50);
  return NextResponse.json({ category });
}
