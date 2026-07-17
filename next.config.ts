import type { NextConfig } from "next";

// ---------- Sentry wrapper ----------
// Sentry is initialized only if SENTRY_DSN is set. This lets the app
// run without Sentry in development and opt-in for production.
const withSentry = (config: NextConfig): NextConfig => {
  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) return config;

  // @sentry/nextjs uses withSentryConfig — but we avoid the build-time
  // wrapper complexity here. Instead we configure the runtime SDK
  // in sentry.client.config.ts, sentry.server.config.ts, and
  // instrumentation.ts. Next.js picks these up automatically.
  return config;
};

// ---------- Security headers ----------
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com;
  style-src 'self' 'unsafe-inline' https://s3.tradingview.com;
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://financialmodelingprep.com https://finnhub.io https://s3.tradingview.com wss://wss.tradingview.com https://*.sentry.io;
  frame-src 'self' https://s.tradingview.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\n/g, "").trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.financialmodelingprep.com",
      },
    ],
  },
};

export default withSentry(nextConfig);
