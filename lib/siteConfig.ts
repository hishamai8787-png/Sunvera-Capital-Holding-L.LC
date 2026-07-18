/**
 * Site configuration — reads from environment variables with sensible defaults.
 * Centralizes the site URL and other config to avoid hardcoding across files.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sunveracapital.com";

export const SITE_NAME = "Sunvera Capital";

export const SITE_DESCRIPTION =
  "Institutional-grade equity analysis, credit proposals, and live market data.";

export const SITE_CONFIG = {
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  locale: "en_US",
  themeColor: "#0a0e1a",
} as const;
