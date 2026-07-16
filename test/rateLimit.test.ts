import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, API_LIMIT, SCANNER_LIMIT } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const result = rateLimit("ip1", "route1", { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const config = { windowMs: 60000, maxRequests: 2 };
    rateLimit("ip2", "route2", config);
    rateLimit("ip2", "route2", config);
    const result = rateLimit("ip2", "route2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("separates by IP and route", () => {
    const config = { windowMs: 60000, maxRequests: 1 };
    rateLimit("ip3", "routeA", config);
    expect(rateLimit("ip3", "routeA", config).allowed).toBe(false);
    expect(rateLimit("ip3", "routeB", config).allowed).toBe(true);
    expect(rateLimit("ip4", "routeA", config).allowed).toBe(true);
  });

  it("resets after window expires", () => {
    const config = { windowMs: 1, maxRequests: 1 };
    rateLimit("ip5", "route5", config);
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = rateLimit("ip5", "route5", config);
        expect(result.allowed).toBe(true);
        resolve(true);
      }, 10);
    });
  });
});
