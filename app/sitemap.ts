import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now = new Date();

  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/dashboard",
    "/settings",
    "/login",
    "/markets",
    "/scanner",
    "/clients",
    "/playbooks",
    "/global",
    "/compare",
    "/forex",
    "/crypto",
    "/metals",
    "/bonds",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // Dynamic analysis routes for popular tickers
  const popularTickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "JPM", "JNJ", "XOM", "KO", "NKE"];
  const tickerRoutes = popularTickers.flatMap((ticker) => [
    {
      url: `${base}/analyze/${ticker}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    },
    {
      url: `${base}/credit/${ticker}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    },
  ]);

  return [...staticRoutes, ...tickerRoutes];
}
