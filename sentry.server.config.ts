// Sentry server-side configuration
// Only initializes if SENTRY_DSN env var is set.

import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Adjust sampling in production
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Don't send events in development unless explicitly enabled
    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_DEV === "true",
  });
}
