// Sentry edge runtime configuration
// Only initializes if SENTRY_DSN env var is set.

import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_DEV === "true",
  });
}
