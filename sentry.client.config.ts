// Sentry client-side configuration
// Only initializes if SENTRY_DSN env var is set.
// Get your DSN from https://sentry.io — create a Next.js project.

import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production to reduce volume.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Capture session replays for errors (10% in prod, 100% in dev)
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "canvas.contentDocument",
      "browser.screenshot",
    ],

    // Don't send events in development unless explicitly enabled
    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_DEV === "true",
  });
}
