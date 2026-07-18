// GET /api/export?type=clients|trades|scan — exports user data as CSV or JSON

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { loadClientsDb, loadTradesDb, loadLastScanDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "clients";
    const format = searchParams.get("format") || "json";

    let data: unknown = null;
    let filename = type;

    if (type === "clients") {
      data = await loadClientsDb();
      filename = "clients";
    } else if (type === "trades") {
      data = await loadTradesDb();
      filename = "trades";
    } else if (type === "scan") {
      data = await loadLastScanDb();
      filename = "last-scan";
    } else {
      return NextResponse.json({ error: "Invalid export type. Use: clients, trades, scan" }, { status: 400 });
    }

    // Handle empty data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json({ message: "No data to export" }, { status: 204 });
    }

    if (format === "csv") {
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        return new NextResponse("No data to export", { status: 204 });
      }
      const headers = Object.keys(rows[0] as Record<string, unknown>);
      const csvLines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = (row as Record<string, unknown>)[h];
              if (val === null || val === undefined) return "";
              const str = typeof val === "object" ? JSON.stringify(val) : String(val);
              return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
            })
            .join(",")
        ),
      ];
      const csv = csvLines.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  } catch (err) {
    logger.error("export", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
