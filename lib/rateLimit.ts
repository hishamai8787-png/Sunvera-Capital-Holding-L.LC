/**
 * Rate limiter for API routes.
 *
 * Production: Uses Upstash Redis for distributed rate limiting across
 * serverless function instances. Set UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN env vars to enable.
 *
 * Development: Falls back to in-memory rate limiting (single instance only).
 *
 * Free FMP plan: 250 requests/day
 * Free Finnhub plan: 60 requests/minute
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
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

// ---------- In-memory fallback (development only) ----------

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

function inMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
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

// ---------- Upstash Redis (production) ----------

let _upstashEnabled: boolean | null = null;

function isUpstashEnabled(): boolean {
  if (_upstashEnabled === null) {
    _upstashEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  }
  return _upstashEnabled;
}

async function upstashRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();

  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const resetAt = now + config.windowMs;

  // Sliding window via atomic INCR + EXPIRE
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, Math.ceil(config.windowMs / 1000));
  }

  if (count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - count, resetAt };
}

// ---------- Public API ----------

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return (forwarded?.split(",")[0] || realIp || "unknown").trim();
}

export async function rateLimit(
  ip: string,
  route: string,
  config: RateLimitConfig = API_LIMIT
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${ip}:${route}`;

  if (isUpstashEnabled()) {
    return upstashRateLimit(key, config);
  }

  return inMemoryRateLimit(key, config);
}

export async function rateLimitResponse(
  req: Request,
  route: string,
  config?: RateLimitConfig
): Promise<Response | null> {
  const ip = getClientIp(req);
  const result = await rateLimit(ip, route, config);
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

// Contact form: 5 submissions per minute to prevent spam
const CONTACT_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 5,
};

export { API_LIMIT, SCANNER_LIMIT, CONTACT_LIMIT };
