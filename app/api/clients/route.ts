// GET /api/clients — list clients. POST /api/clients — save the full list.

import { NextResponse } from "next/server";
import { loadClients, saveClients } from "@/lib/clients";
import type { Client } from "@/lib/clientTypes";

export async function GET() {
  return NextResponse.json(await loadClients());
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Client[];
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of clients." }, { status: 400 });
    }
    await saveClients(body);
    return NextResponse.json({ saved: body.length });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
