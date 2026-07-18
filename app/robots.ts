import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/settings", "/dashboard"],
    },
    sitemap: "https://sunveracapital.com/sitemap.xml",
  };
}
