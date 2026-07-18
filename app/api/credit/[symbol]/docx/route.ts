// GET /api/credit/AAPL/docx?amount=...&tenor=... — downloads the credit
// proposal as a formatted Word document.

import { logger } from "@/lib/logger";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from "docx";
import { buildCreditReport } from "@/lib/creditReport";
import type { FacilityInput } from "@/lib/credit";
import { money } from "@/lib/ratios";
import { DataSourceError } from "@/lib/fmp";

const PAGE = { width: 12240, height: 15840 }; // US Letter, DXA
const TABLE_WIDTH = 9360; // 6.5" content width

const fx = (v: number | null, d = 1) => (v === null ? "—" : `${v.toFixed(d)}x`);
const fp = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

function parseFacility(sp: URLSearchParams): FacilityInput | null {
  const amount = Number(sp.get("amount") || 0);
  if (!amount || amount <= 0) return null;
  return {
    amount,
    tenorYears: Math.max(1, Number(sp.get("tenor") || 5)),
    rate: Math.max(0, Number(sp.get("rate") || 6)) / 100,
    type: sp.get("type") || "Term Loan",
    purpose: sp.get("purpose") || "",
    security: sp.get("security") || "Unsecured",
  };
}

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
};

function cell(text: string, opts: { bold?: boolean; width: number; header?: boolean; right?: boolean } ) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    borders: cellBorders,
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: "1F2937", color: "auto" }
      : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold: opts.bold || opts.header,
            color: opts.header ? "FFFFFF" : undefined,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function metricsTable(rows: { label: string; value: string; benchmark: string }[]): Table {
  const w = [4680, 1560, 3120];
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: w,
    rows: [
      new TableRow({
        children: [
          cell("Metric", { width: w[0], header: true }),
          cell("Value", { width: w[1], header: true, right: true }),
          cell("Benchmark", { width: w[2], header: true }),
        ],
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: [
              cell(r.label, { width: w[0] }),
              cell(r.value, { width: w[1], right: true, bold: true }),
              cell(r.benchmark, { width: w[2] }),
            ],
          })
      ),
    ],
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const url = new URL(req.url);
  const facility = parseFacility(url.searchParams);
  const peers = (url.searchParams.get("peers") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let report;
  try {
    report = await buildCreditReport(decodeURIComponent(symbol), facility, peers);
  } catch (err) {
    const status = err instanceof DataSourceError ? (err.status ?? 502) : 500;
    logger.error("credit/docx", err instanceof Error ? err.message : String(err));
    return new Response(
      status === 404 ? "Company not found." : "Failed to generate credit report.",
      { status }
    );
  }

  const cur = report.currency;
  const children: (Paragraph | Table)[] = [];

  // Title block
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: "CREDIT PROPOSAL", bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${report.profile.companyName} (${report.symbol})`,
          size: 28,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${report.profile.exchange} · ${report.profile.sector} · ${report.profile.industry}`,
          size: 20,
          color: "666666",
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Sunvera Capital · Prepared ${new Date(report.generatedAt).toLocaleDateString()} · Internal Rating: ${report.assessment.rating.grade}/10 (${report.assessment.rating.label})`,
          size: 20,
          color: "666666",
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Key figures table
  const kf = [
    { label: "Revenue (latest FY)", value: money(report.derived.revenue, cur), benchmark: "" },
    { label: "EBITDA", value: money(report.derived.ebitda, cur), benchmark: "" },
    { label: "Operating Cash Flow", value: money(report.derived.ocf, cur), benchmark: "" },
    { label: "Free Cash Flow", value: money(report.derived.fcf, cur), benchmark: "" },
    { label: "Total Debt", value: money(report.derived.totalDebt, cur), benchmark: "" },
    { label: "Net Debt", value: money(report.derived.netDebt, cur), benchmark: "" },
  ];
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Key Figures")] }),
    metricsTable(kf)
  );

  // Narrative sections
  for (const sec of report.narrative) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280 },
        children: [new TextRun(sec.title)],
      })
    );
    for (const para of sec.paragraphs) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: para, size: 21 })],
        })
      );
    }
  }

  // Credit metrics
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 280 },
      children: [new TextRun("Credit Metrics Detail")],
    }),
    metricsTable(
      report.assessment.metrics.map((m) => ({
        label: m.label,
        value: m.display,
        benchmark: m.benchmark,
      }))
    )
  );

  // Pro-forma
  if (report.assessment.proForma) {
    const pf = report.assessment.proForma;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280 },
        children: [new TextRun("Pro-Forma Impact (facility fully drawn)")],
      }),
      metricsTable([
        { label: "Net Debt / EBITDA", value: `${fx(pf.netDebtEbitda.before)} → ${fx(pf.netDebtEbitda.after)}`, benchmark: "before → after" },
        { label: "Interest Coverage", value: `${fx(pf.interestCoverage.before)} → ${fx(pf.interestCoverage.after)}`, benchmark: "before → after" },
        { label: "Debt / Equity", value: `${fx(pf.debtToEquity.before, 2)} → ${fx(pf.debtToEquity.after, 2)}`, benchmark: "before → after" },
        { label: "Annual Debt Service (new facility)", value: money(pf.annualDebtService, cur), benchmark: "interest + straight-line principal" },
        { label: "Pro-forma Cash DSCR", value: fx(pf.dscrProForma, 2), benchmark: "≥ 1.25x policy floor" },
      ])
    );
  }

  // Peer comparison
  if (report.peers && report.peers.peers.some((p) => !p.failed)) {
    const pc = report.peers;
    const w = [2340, 1404, 1404, 1404, 1404, 1404];
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280 },
        children: [new TextRun("Peer Comparison")],
      }),
      new Table({
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        columnWidths: w,
        rows: [
          new TableRow({
            children: [
              cell("Company", { width: w[0], header: true }),
              cell("EBITDA Mgn", { width: w[1], header: true, right: true }),
              cell("ND/EBITDA", { width: w[2], header: true, right: true }),
              cell("Int. Cover", { width: w[3], header: true, right: true }),
              cell("D/E", { width: w[4], header: true, right: true }),
              cell("Rev 3y CAGR", { width: w[5], header: true, right: true }),
            ],
          }),
          ...[{ ...pc.subject, companyName: report.profile.companyName }, ...pc.peers.filter((p) => !p.failed)].map(
            (p) =>
              new TableRow({
                children: [
                  cell(`${p.companyName ?? p.symbol} (${p.symbol})`, { width: w[0] }),
                  cell(fp(p.ebitdaMargin), { width: w[1], right: true }),
                  cell(fx(p.netDebtEbitda), { width: w[2], right: true }),
                  cell(fx(p.interestCoverage), { width: w[3], right: true }),
                  cell(fx(p.debtToEquity, 2), { width: w[4], right: true }),
                  cell(fp(p.revenueGrowth3y), { width: w[5], right: true }),
                ],
              })
          ),
          new TableRow({
            children: [
              cell("Peer median", { width: w[0], bold: true }),
              cell(fp(pc.median.ebitdaMargin), { width: w[1], right: true, bold: true }),
              cell(fx(pc.median.netDebtEbitda), { width: w[2], right: true, bold: true }),
              cell(fx(pc.median.interestCoverage), { width: w[3], right: true, bold: true }),
              cell(fx(pc.median.debtToEquity, 2), { width: w[4], right: true, bold: true }),
              cell(fp(pc.median.revenueGrowth3y), { width: w[5], right: true, bold: true }),
            ],
          }),
        ],
      })
    );
  }

  // Multi-year trend
  {
    const w = [1560, 1560, 1560, 1560, 1560, 1560];
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280 },
        children: [new TextRun("Multi-Year Credit Trend")],
      }),
      new Table({
        width: { size: TABLE_WIDTH, type: WidthType.DXA },
        columnWidths: w,
        rows: [
          new TableRow({
            children: [
              cell("FY", { width: w[0], header: true }),
              cell("Revenue", { width: w[1], header: true, right: true }),
              cell("EBITDA", { width: w[2], header: true, right: true }),
              cell("ND/EBITDA", { width: w[3], header: true, right: true }),
              cell("OCF", { width: w[4], header: true, right: true }),
              cell("FCF", { width: w[5], header: true, right: true }),
            ],
          }),
          ...report.assessment.trend.map(
            (t) =>
              new TableRow({
                children: [
                  cell(t.year, { width: w[0] }),
                  cell(money(t.revenue, cur), { width: w[1], right: true }),
                  cell(money(t.ebitda, cur), { width: w[2], right: true }),
                  cell(fx(t.netDebtEbitda), { width: w[3], right: true }),
                  cell(money(t.ocf, cur), { width: w[4], right: true }),
                  cell(money(t.fcf, cur), { width: w[5], right: true }),
                ],
              })
          ),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { size: PAGE, margin: { top: 1080, bottom: 1080, left: 1440, right: 1440 } },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Credit_Proposal_${report.symbol}_${new Date().toISOString().slice(0, 10)}.docx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
