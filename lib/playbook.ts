// Playbook engine — turns raw trade history into "what worked" insight:
// stats per segment (sector / asset class / market / year), winner-vs-loser
// pattern detection, and a generated playbook narrative for each segment.

import type { Trade } from "./trades";

export interface SegmentStats {
  segment: string;
  trades: number;
  closed: number;
  winRate: number | null; // fraction of closed trades with pnl > 0
  avgReturn: number | null; // mean pnlPct of closed trades
  medianReturn: number | null;
  totalPnl: number | null;
  avgHoldingDays: number | null;
  best: Trade | null;
  worst: Trade | null;
  narrative: string[];
}

export interface PlaybookReport {
  overall: SegmentStats;
  bySector: SegmentStats[];
  byAssetClass: SegmentStats[];
  byMarket: SegmentStats[];
  byYear: SegmentStats[];
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const pct = (v: number | null, d = 1): string =>
  v === null ? "—" : `${(v * 100).toFixed(d)}%`;

const money = (v: number | null): string => {
  if (v === null) return "—";
  const sign = v < 0 ? "-" : "+";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

function computeStats(segment: string, trades: Trade[], context: "overall" | "segment"): SegmentStats {
  const closed = trades.filter((t) => t.dateClosed !== null && t.pnlPct !== null);
  const returns = closed.map((t) => t.pnlPct as number);
  const pnls = closed.map((t) => t.pnl).filter((v): v is number => v !== null);
  const holds = closed.map((t) => t.holdingDays).filter((v): v is number => v !== null);
  const winners = closed.filter((t) => (t.pnlPct as number) > 0);
  const losers = closed.filter((t) => (t.pnlPct as number) <= 0);

  const winRate = closed.length ? winners.length / closed.length : null;
  const avgReturn = mean(returns);
  const totalPnl = pnls.length ? pnls.reduce((a, b) => a + b, 0) : null;

  const best = closed.length
    ? closed.reduce((a, b) => ((a.pnlPct ?? -Infinity) >= (b.pnlPct ?? -Infinity) ? a : b))
    : null;
  const worst = closed.length
    ? closed.reduce((a, b) => ((a.pnlPct ?? Infinity) <= (b.pnlPct ?? Infinity) ? a : b))
    : null;

  // ---- narrative ----
  const narrative: string[] = [];
  if (closed.length >= 2) {
    narrative.push(
      `${closed.length} closed trade${closed.length === 1 ? "" : "s"}${trades.length > closed.length ? ` (${trades.length - closed.length} still open)` : ""}: ${pct(winRate, 0)} hit rate, averaging ${pct(avgReturn)} per trade${mean(holds) !== null ? ` over a typical ${Math.round(mean(holds) as number)} days` : ""}, for ${money(totalPnl)} total.`
    );

    // pattern: holding period of winners vs losers
    const winHold = mean(winners.map((t) => t.holdingDays).filter((v): v is number => v !== null));
    const loseHold = mean(losers.map((t) => t.holdingDays).filter((v): v is number => v !== null));
    if (winHold !== null && loseHold !== null && winners.length >= 2 && losers.length >= 2) {
      if (loseHold > winHold * 1.5)
        narrative.push(
          `Pattern: losers were held ${Math.round(loseHold)} days vs ${Math.round(winHold)} for winners — losing positions were ridden too long. A stop-loss discipline would have protected ${segment.toLowerCase() === "overall" ? "the book" : "this segment"}.`
        );
      else if (winHold > loseHold * 1.5)
        narrative.push(
          `Pattern: winners were held ${Math.round(winHold)} days vs ${Math.round(loseHold)} for losers — patience paid; the edge came from letting good theses mature.`
        );
    }

    // pattern: direction
    const longWins = winners.filter((t) => t.direction === "Long").length;
    const shorts = closed.filter((t) => t.direction === "Short");
    if (shorts.length >= 2) {
      const shortWinRate = shorts.filter((t) => (t.pnlPct as number) > 0).length / shorts.length;
      const longs = closed.filter((t) => t.direction === "Long");
      const longWinRate = longs.length ? longWins / longs.length : null;
      if (longWinRate !== null && Math.abs(shortWinRate - longWinRate) > 0.2) {
        narrative.push(
          shortWinRate > longWinRate
            ? `Shorts outperformed here (${pct(shortWinRate, 0)} vs ${pct(longWinRate, 0)} hit rate on longs).`
            : `Long positions carried this segment (${pct(longWinRate, 0)} vs ${pct(shortWinRate, 0)} hit rate on shorts).`
        );
      }
    }

    if (best && best.pnlPct != null && context === "segment") {
      narrative.push(
        `Best: ${best.symbol} ${pct(best.pnlPct ?? null)}${best.thesis ? ` ("${best.thesis}")` : ""}${worst && worst.pnlPct != null && worst.id !== best.id ? `; worst: ${worst.symbol} ${pct(worst.pnlPct ?? null)}${worst.notes ? ` — ${worst.notes}` : ""}` : ""}.`
      );
    }

    // verdict
    if (winRate !== null && avgReturn !== null) {
      narrative.push(
        winRate >= 0.6 && avgReturn > 0.05
          ? `Playbook verdict: this is a proven hunting ground — repeat the setup that worked here.`
          : winRate >= 0.5 && avgReturn > 0
            ? `Playbook verdict: modest edge — size positions accordingly and tighten entry criteria.`
            : `Playbook verdict: no demonstrated edge — treat new ideas here with extra scrutiny or avoid.`
      );
    }
  } else if (closed.length === 1) {
    narrative.push(
      `Only one closed trade — not enough history for a playbook. Result: ${pct(returns[0])}.`
    );
  } else if (trades.length) {
    narrative.push(`${trades.length} open position(s), none closed yet — no track record to analyze.`);
  }

  return {
    segment,
    trades: trades.length,
    closed: closed.length,
    winRate,
    avgReturn,
    medianReturn: median(returns),
    totalPnl,
    avgHoldingDays: mean(holds),
    best,
    worst,
    narrative,
  };
}

function groupBy(trades: Trade[], key: (t: Trade) => string): SegmentStats[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = key(t) || "Unclassified";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  return Array.from(groups.entries())
    .map(([k, ts]) => computeStats(k, ts, "segment"))
    .sort((a, b) => (b.totalPnl ?? -Infinity) - (a.totalPnl ?? -Infinity));
}

export function buildPlaybook(trades: Trade[]): PlaybookReport {
  return {
    overall: computeStats("Overall", trades, "overall"),
    bySector: groupBy(trades, (t) => t.sector),
    byAssetClass: groupBy(trades, (t) => t.assetClass),
    byMarket: groupBy(trades, (t) => t.market),
    byYear: groupBy(trades, (t) => t.date.slice(0, 4)),
  };
}
