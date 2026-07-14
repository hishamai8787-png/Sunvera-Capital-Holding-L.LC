// GET /api/news?category=general|forex|crypto — market-wide news from Finnhub.

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key || key.startsWith("PASTE_")) {
    return NextResponse.json([]);
  }
  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "general";

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${key}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json([]);
    const items = (await res.json()) as {
      headline: string;
      summary: string;
      source: string;
      url: string;
      datetime: number;
      image?: string;
    }[];
    return NextResponse.json(items.slice(0, 20));
  } catch {
    return NextResponse.json([]);
  }
}
