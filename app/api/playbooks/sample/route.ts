// POST /api/playbooks/sample — load the bundled demo dataset.
// DELETE /api/playbooks/sample — clear all trade data.

import { NextResponse } from "next/server";
import { saveTrades } from "@/lib/trades";
import { SAMPLE_TRADES } from "@/lib/sampleTrades";

export async function POST() {
  await saveTrades(SAMPLE_TRADES);
  return NextResponse.json({ imported: SAMPLE_TRADES.length });
}

export async function DELETE() {
  await saveTrades([]);
  return NextResponse.json({ cleared: true });
}
