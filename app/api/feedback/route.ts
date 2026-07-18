import { NextResponse } from "next/server";
import { rateLimitResponse } from "@/lib/rateLimit";

const FEEDBACK_LIMIT = { windowMs: 60_000, maxRequests: 3 };

export async function POST(req: Request) {
  const limited = await rateLimitResponse(req, "feedback", FEEDBACK_LIMIT);
  if (limited) return limited;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { type, message, page } = body as { type?: string; message?: string; page?: string };

  if (!message || message.trim().length < 5) {
    return NextResponse.json({ error: "Please provide a message (min 5 characters)." }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 characters)." }, { status: 400 });
  }

  const validTypes = ["bug", "feature", "improvement", "other"];
  const feedbackType = validTypes.includes(type ?? "") ? type : "other";

  console.log("[FEEDBACK]", {
    type: feedbackType,
    page: page || "unknown",
    message: message.trim().slice(0, 500),
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: "Thank you for your feedback!" });
}
