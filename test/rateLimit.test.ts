import { describe, it, expect } from "vitest";
import { rateLimit, API_LIMIT, SCANNER_LIMIT } from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows requests within limit", async () => {
    const result = await rateLimit("ip1", "route1", { windowMs: 60000, maxRequests: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", async () => {
    const config = { windowMs: 60000, maxRequests: 2 };
    await rateLimit("ip2", "route2", config);
    await rateLimit("ip2", "route2", config);
    const result = await rateLimit("ip2", "route2", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("separates by IP and route", async () => {
    const config = { windowMs: 60000, maxRequests: 1 };
    await rateLimit("ip3", "routeA", config);
    expect((await rateLimit("ip3", "routeA", config)).allowed).toBe(false);
    expect((await rateLimit("ip3", "routeB", config)).allowed).toBe(true);
    expect((await rateLimit("ip4", "routeA", config)).allowed).toBe(true);
  });

  it("resets after window expires", async () => {
    const config = { windowMs: 1, maxRequests: 1 };
    await rateLimit("ip5", "route5", config);
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await rateLimit("ip5", "route5", config);
        expect(result.allowed).toBe(true);
        resolve(true);
      }, 10);
    });
  });
});
