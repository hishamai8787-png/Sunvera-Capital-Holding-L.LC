// Server-renderable presentational components for the analysis report.

import type {
  AnalysisReport,
  Metric,
  MetricCategory,
  GrowthRow,
  Verdict,
} from "@/lib/types";

const verdictDot: Record<Verdict, string> = {
  strong: "bg-emerald-400",
  good: "bg-emerald-600",
  neutral: "bg-slate-500",
  weak: "bg-amber-500",
  poor: "bg-red-500",
  na: "bg-slate-700",
};

const verdictText: Record<Verdict, string> = {
  strong: "text-emerald-300",
  good: "text-emerald-400",
  neutral: "text-slate-300",
  weak: "text-amber-400",
  poor: "text-red-400",
  na: "text-slate-500",
};

function ScoreGauge({ total }: { total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (total / 100) * c * 0.75; // 270° arc
  const track = c * 0.75;
  const color = total >= 80 ? "#6ee7b7" : total >= 60 ? "#fbbf24" : "#f87171";
  return (
    <svg viewBox="0 0 128 128" className="w-32 h-32">
      <g transform="rotate(135 64 64)">
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="#1e293b" strokeWidth="10"
          strokeDasharray={`${track} ${c}`} strokeLinecap="round"
        />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </g>
      <text x="64" y="60" textAnchor="middle" fill={color} fontSize="30" fontWeight="700">
        {total}
      </text>
      <text x="64" y="80" textAnchor="middle" fill="#64748b" fontSize="12">
        / 100
      </text>
    </svg>
  );
}

export function ScoreCard({ report }: { report: AnalysisReport }) {
  const { score } = report;
  const ratingColor =
    score.total >= 80
      ? "text-emerald-300"
      : score.total >= 70
        ? "text-emerald-400"
        : score.total >= 60
          ? "text-amber-300"
          : "text-red-400";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">
            Sunvera Score
          </h2>
          <div className={`text-sm font-medium mt-1 ${ratingColor}`}>{score.rating}</div>
        </div>
        <ScoreGauge total={score.total} />
      </div>
      <div className="space-y-3">
        {score.breakdown.map((b) => (
          <div key={b.category}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">{b.category}</span>
              <span className="text-slate-400">
                {b.earned} / {b.weight}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800">
              <div
                className="h-1.5 rounded-full bg-amber-400/90"
                style={{ width: `${Math.min(100, (b.earned / b.weight) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickStats({ report }: { report: AnalysisReport }) {
  const { altman, piotroski, dcf } = report;
  const zoneLabel =
    altman.zone === "safe"
      ? "Safe zone"
      : altman.zone === "grey"
        ? "Grey zone"
        : altman.zone === "distress"
          ? "Distress"
          : "N/A";
  const zoneColor =
    altman.zone === "safe"
      ? "text-emerald-300"
      : altman.zone === "grey"
        ? "text-amber-300"
        : altman.zone === "distress"
          ? "text-red-400"
          : "text-slate-500";
  const mos = dcf.marginOfSafety;

  const stats = [
    {
      label: "Altman Z-Score",
      value: altman.z !== null ? altman.z.toFixed(2) : "—",
      sub: zoneLabel,
      color: zoneColor,
    },
    {
      label: "Piotroski F-Score",
      value: `${piotroski.score}/9`,
      sub: piotroski.score >= 7 ? "Improving" : piotroski.score >= 4 ? "Mixed" : "Deteriorating",
      color:
        piotroski.score >= 7
          ? "text-emerald-300"
          : piotroski.score >= 4
            ? "text-amber-300"
            : "text-red-400",
    },
    {
      label: "DCF Fair Value",
      value:
        dcf.fairValuePerShare !== null ? `$${dcf.fairValuePerShare.toFixed(2)}` : "—",
      sub: `vs price $${dcf.currentPrice.toFixed(2)}`,
      color: "text-slate-200",
    },
    {
      label: "Margin of Safety",
      value: mos !== null ? `${(mos * 100).toFixed(0)}%` : "—",
      sub: mos !== null ? (mos >= 0.25 ? "Undervalued" : mos >= 0 ? "Fairly valued" : "Premium") : "",
      color:
        mos === null
          ? "text-slate-500"
          : mos >= 0.25
            ? "text-emerald-300"
            : mos >= 0
              ? "text-amber-300"
              : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{s.label}</div>
          <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
          <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function RatioTable({ category }: { category: MetricCategory }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
        {category.label}
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {category.metrics.map((mt: Metric) => (
            <tr key={mt.key} className="border-b border-slate-800/60 last:border-0">
              <td className="px-5 py-2.5 text-slate-300">
                <span className={`inline-block w-2 h-2 rounded-full mr-2.5 ${verdictDot[mt.verdict]}`} />
                {mt.label}
                {mt.note && (
                  <span className="block text-xs text-slate-500 ml-[18px]">{mt.note}</span>
                )}
              </td>
              <td className={`px-5 py-2.5 text-right font-medium tabular-nums ${verdictText[mt.verdict]}`}>
                {mt.display}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const gpct = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
const gcolor = (v: number | null) =>
  v === null ? "text-slate-600" : v >= 0 ? "text-emerald-400" : "text-red-400";

export function GrowthTable({ growth }: { growth: GrowthRow[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <h3 className="px-5 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800 bg-slate-900">
        Growth &amp; CAGR
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-right font-medium">YoY</th>
              <th className="px-3 py-2 text-right font-medium">3y CAGR</th>
              <th className="px-3 py-2 text-right font-medium">5y CAGR</th>
              <th className="px-5 py-2 text-right font-medium">10y CAGR</th>
            </tr>
          </thead>
          <tbody>
            {growth.map((g) => (
              <tr key={g.metric} className="border-t border-slate-800/60">
                <td className="px-5 py-2.5 text-slate-300">{g.metric}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${gcolor(g.yoy)}`}>{gpct(g.yoy)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${gcolor(g.cagr3)}`}>{gpct(g.cagr3)}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${gcolor(g.cagr5)}`}>{gpct(g.cagr5)}</td>
                <td className={`px-5 py-2.5 text-right tabular-nums ${gcolor(g.cagr10)}`}>{gpct(g.cagr10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Narrative({ report }: { report: AnalysisReport }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-slate-200">Analysis</h2>
      {report.narrative.map((sec) => (
        <section key={sec.title}>
          <h3 className="text-amber-300/90 font-medium mb-2">{sec.title}</h3>
          {sec.paragraphs.map((p, i) => (
            <p key={i} className="text-slate-300 leading-relaxed mb-2 last:mb-0">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

export function NewsList({ report }: { report: AnalysisReport }) {
  if (!report.news.length) return null;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent News</h2>
      <ul className="space-y-3">
        {report.news.map((n, i) => (
          <li key={i}>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-200 hover:text-amber-300 transition-colors"
            >
              {n.headline}
            </a>
            <div className="text-xs text-slate-500">
              {n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
