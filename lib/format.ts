/**
 * Shared currency and number formatting utilities.
 * Ensures consistent formatting across all components and pages.
 */

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  SAR: "﷼",
  AED: "د.إ",
  QAR: "﷼",
  KWD: "د.ك",
  CHF: "Fr",
  CAD: "C$",
  AUD: "A$",
  CNY: "¥",
  INR: "₹",
};

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || !isFinite(value)) return "—";
  const symbol = currencySymbols[currency] ?? "";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${symbol}${(value / 1e3).toFixed(2)}K`;
  return `${symbol}${value.toFixed(2)}`;
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatRatio(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !isFinite(value)) return "—";
  return value.toFixed(decimals);
}

export function formatPrice(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || !isFinite(value)) return "—";
  const symbol = currencySymbols[currency] ?? "$";
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
