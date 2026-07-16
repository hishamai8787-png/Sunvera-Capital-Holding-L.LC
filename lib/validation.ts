/**
 * Input validation and sanitization for all API routes.
 * Prevents SSRF, path traversal, and injection attacks.
 */

// Valid ticker symbol: 1-6 uppercase letters, optionally with . or - for intl
const TICKER_REGEX = /^[A-Z]{1,6}([.\-][A-Z]{1,3})?$/;

// Valid peer list: comma-separated tickers
const PEER_LIST_REGEX = /^[A-Z]{1,6}([.\-][A-Z]{1,3})?(,[A-Z]{1,6}([.\-][A-Z]{1,3})?){0,9}$/;

// Sanitize string input: trim, remove control chars, limit length
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // control characters
    .slice(0, maxLength);
}

// Validate and sanitize a ticker symbol
export function validateTicker(symbol: string): string | null {
  const cleaned = sanitizeString(symbol, 20).toUpperCase();
  if (!TICKER_REGEX.test(cleaned)) return null;
  return cleaned;
}

// Validate a list of peer symbols
export function validatePeerList(peers: string): string[] {
  const cleaned = sanitizeString(peers, 200).toUpperCase();
  if (!cleaned) return [];
  const parts = cleaned.split(",").map(s => s.trim());
  return parts.filter(p => TICKER_REGEX.test(p)).slice(0, 10);
}

// Validate a positive number
export function validatePositiveNumber(value: string, max: number = 1e12): number | null {
  const num = Number(value);
  if (!isFinite(num) || num <= 0 || num > max) return null;
  return num;
}

// Validate a bounded number
export function validateBoundedNumber(
  value: string,
  min: number,
  max: number
): number | null {
  const num = Number(value);
  if (!isFinite(num) || num < min || num > max) return null;
  return num;
}

// Validate a string against an allowlist
export function validateAllowlist(
  value: string,
  allowlist: string[]
): string | null {
  const cleaned = sanitizeString(value, 50);
  return allowlist.includes(cleaned) ? cleaned : null;
}

// Validate client data structure (for POST /api/clients)
export function validateClientData(data: unknown): boolean {
  if (!Array.isArray(data)) return false;
  for (const item of data) {
    if (typeof item !== "object" || item === null) return false;
    const c = item as Record<string, unknown>;
    if (typeof c.id !== "string" || c.id.length > 100) return false;
    if (typeof c.name !== "string" || c.name.length > 200) return false;
    if (typeof c.notes !== "string" || c.notes.length > 5000) return false;
    if (c.positions && !Array.isArray(c.positions)) return false;
  }
  return true;
}

// URL-safe category for news
const NEWS_CATEGORIES = ["general", "forex", "crypto", "merger"];
export function validateNewsCategory(cat: string): string {
  return validateAllowlist(cat, NEWS_CATEGORIES) || "general";
}
