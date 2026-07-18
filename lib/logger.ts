/**
 * Structured logging utility.
 * Replaces console.error/log with tagged, structured output.
 * In production, this could forward to Sentry or another log aggregator.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, tag: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] [${tag}]`;
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `${prefix} ${message}${metaStr}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (tag: string, message: string, meta?: Record<string, unknown>) => log("info", tag, message, meta),
  warn: (tag: string, message: string, meta?: Record<string, unknown>) => log("warn", tag, message, meta),
  error: (tag: string, message: string, meta?: Record<string, unknown>) => log("error", tag, message, meta),
  debug: (tag: string, message: string, meta?: Record<string, unknown>) => log("debug", tag, message, meta),
};
