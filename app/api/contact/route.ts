import { NextResponse } from "next/server";
import { rateLimitResponse, CONTACT_LIMIT } from "@/lib/rateLimit";
import { sanitizeString } from "@/lib/validation";

export async function POST(req: Request) {
  const rl = await rateLimitResponse(req, "contact", CONTACT_LIMIT);
  if (rl) return rl;

  try {
    const body = await req.json();

    const name = sanitizeString(body?.name ?? "", 100);
    const email = sanitizeString(body?.email ?? "", 200);
    const subject = sanitizeString(body?.subject ?? "General Inquiry", 200);
    const message = sanitizeString(body?.message ?? "", 2000);

    // Validate
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }

    // TODO: When Supabase is configured, insert into ContactSubmissions table
    // For now, log the submission (server-side only, no PII in logs)
    console.log(`[contact] New submission from ${email.length}@${email.split("@")[1] || "unknown"}: ${subject}`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
