// Next.js instrumentation hook — registers Sentry on server startup.
// Sentry config files (sentry.server.config.ts, sentry.client.config.ts,
// sentry.edge.config.ts) are auto-loaded by @sentry/nextjs.
// This file ensures proper initialization order.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
