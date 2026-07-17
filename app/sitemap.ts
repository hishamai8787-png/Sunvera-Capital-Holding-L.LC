import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sunveracapital.com";
  const now = new Date();

  const staticRoutes = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${base}/markets`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${base}/scanner`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${base}/clients`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${base}/playbooks`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${base}/global`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  // Popular tickers for equity analysis pages
  const popularTickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META",
    "TSLA", "JNJ", "JPM", "V", "WMT", "KO",
    "PEP", "COST", "DIS", "NFLX", "NKE", "BAC",
  ];

  const analyzeRoutes = popularTickers.map((t) => ({
    url: `${base}/analyze/${t}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));

  const creditRoutes = popularTickers.map((t) => ({
    url: `${base}/credit/${t}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...analyzeRoutes, ...creditRoutes];
}
