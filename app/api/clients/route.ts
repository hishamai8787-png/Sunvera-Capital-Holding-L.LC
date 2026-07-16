import { NextResponse } from "next/server";
import { loadClients, saveClients } from "@/lib/clients";
import { validateClientData } from "@/lib/validation";
import { rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const rl = rateLimitResponse(req, "clients-get");
  if (rl) return rl;
  return NextResponse.json(await loadClients());
}

export async function POST(req: Request) {
  const rl = rateLimitResponse(req, "clients-save");
  if (rl) return rl;

  try {
    const body = await req.json();
    if (!validateClientData(body)) {
      return NextResponse.json({ error: "Invalid client data format." }, { status: 400 });
    }
    await saveClients(body);
    return NextResponse.json({ saved: body.length });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
