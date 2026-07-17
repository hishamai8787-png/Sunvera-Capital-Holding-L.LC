import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";
import { loadClientsDb, saveClientsDb } from "@/lib/db";
import type { Client } from "@/lib/clientTypes";

export async function GET(req: Request) {
  const rl = await rateLimitResponse(req, "clients-get");
  if (rl) return rl;
  const clients = await loadClientsDb<Client>();
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const rl = await rateLimitResponse(req, "clients-save");
  if (rl) return rl;
  try {
    const clients = (await req.json()) as Client[];
    await saveClientsDb(clients);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save clients." }, { status: 500 });
  }
}
