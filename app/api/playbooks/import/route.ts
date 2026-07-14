// POST /api/playbooks/import — multipart upload of .xlsx/.csv trade history.

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { rowsToTrades, saveTrades } from "@/lib/trades";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) {
      return NextResponse.json({ error: "The file has no sheets." }, { status: 400 });
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const { trades, warnings } = rowsToTrades(rows);
    if (!trades.length) {
      return NextResponse.json(
        { error: warnings[0] ?? "No valid trade rows found." },
        { status: 400 }
      );
    }
    await saveTrades(trades);
    return NextResponse.json({ imported: trades.length, warnings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
