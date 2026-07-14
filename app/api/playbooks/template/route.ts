// GET /api/playbooks/template — downloadable Excel template for trade history.

import * as XLSX from "xlsx";
import { TEMPLATE_HEADERS } from "@/lib/trades";

export async function GET() {
  const example = [
    "2024-01-15",
    "2024-06-20",
    "Equity",
    "MSFT",
    "Microsoft",
    "Technology",
    "US",
    "Long",
    390,
    445,
    100,
    5500,
    "14.1%",
    "Cloud growth thesis",
    "Exited on target",
  ];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example]);
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Trades");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="Sunvera_Trade_History_Template.xlsx"',
    },
  });
}
