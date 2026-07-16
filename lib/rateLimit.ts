/**
 * Simple in-memory rate limiter for API routes.
 * In production, swap for Upstash Redis for distributed rate limiting.
 * 
 * Free FMP plan: 250 requests/day
 * Free Finnhub plan: 60 requests/minute
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

interface RateLimitConfig {
  windowMs: number;   // time window in milliseconds
  maxRequests: number; // max requests per window
}

// Per-IP rate limits for API endpoints
const API_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,     // 1 minute
  maxRequests: 30,          // 30 requests per minute per IP
};

// Stricter limit for the scanner (heavy operation)
const SCANNER_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 3,           // 3 scans per minute
};

export function rateLimit(
  ip: string,
  route: string,
  config: RateLimitConfig = API_LIMIT
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (bucket.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return (forwarded?.split(",")[0] || realIp || "unknown").trim();
}

export function rateLimitResponse(
  req: Request,
  route: string,
  config?: RateLimitConfig
): Response | null {
  const ip = getClientIp(req);
  const result = rateLimit(ip, route, config);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Please try again shortly.",
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }
  return null;
}

export { API_LIMIT, SCANNER_LIMIT };
