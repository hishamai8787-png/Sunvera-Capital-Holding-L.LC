import { describe, it, expect } from "vitest";
import {
  validateTicker,
  validatePeerList,
  sanitizeString,
  validatePositiveNumber,
  validateBoundedNumber,
  validateNewsCategory,
} from "@/lib/validation";

describe("validateTicker", () => {
  it("accepts valid tickers", () => {
    expect(validateTicker("AAPL")).toBe("AAPL");
    expect(validateTicker("msft")).toBe("MSFT");
    expect(validateTicker("BRK.B")).toBe("BRK.B");
  });

  it("rejects invalid tickers", () => {
    expect(validateTicker("")).toBeNull();
    expect(validateTicker("AAAAAAAAAA")).toBeNull();
    expect(validateTicker("123")).toBeNull();
    expect(validateTicker("'; DROP TABLE")).toBeNull();
    expect(validateTicker("<script>")).toBeNull();
  });
});

describe("validatePeerList", () => {
  it("accepts comma-separated tickers", () => {
    expect(validatePeerList("AAPL,MSFT,GOOGL")).toEqual(["AAPL", "MSFT", "GOOGL"]);
  });

  it("filters out invalid entries", () => {
    expect(validatePeerList("AAPL,invalid,MSFT")).toEqual(["AAPL", "MSFT"]);
  });

  it("limits to 10 peers", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `AAA${"A".repeat(i+1)}`.slice(0,4)).join(",");
    const result = validatePeerList(eleven);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("returns empty for invalid input", () => {
    expect(validatePeerList("")).toEqual([]);
    expect(validatePeerList("!!!")).toEqual([]);
  });
});

describe("sanitizeString", () => {
  it("trims and removes control characters", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
    expect(sanitizeString("hello\x00world")).toBe("helloworld");
    expect(sanitizeString("hello\x1Fworld")).toBe("helloworld");
  });

  it("limits length", () => {
    expect(sanitizeString("a".repeat(2000), 100)).toHaveLength(100);
  });
});

describe("validatePositiveNumber", () => {
  it("accepts positive numbers", () => {
    expect(validatePositiveNumber("100")).toBe(100);
    expect(validatePositiveNumber("0.5")).toBe(0.5);
  });

  it("rejects non-positive or invalid", () => {
    expect(validatePositiveNumber("0")).toBeNull();
    expect(validatePositiveNumber("-5")).toBeNull();
    expect(validatePositiveNumber("abc")).toBeNull();
    expect(validatePositiveNumber("")).toBeNull();
  });
});

describe("validateBoundedNumber", () => {
  it("accepts within bounds", () => {
    expect(validateBoundedNumber("5", 1, 10)).toBe(5);
    expect(validateBoundedNumber("1", 1, 10)).toBe(1);
    expect(validateBoundedNumber("10", 1, 10)).toBe(10);
  });

  it("rejects out of bounds", () => {
    expect(validateBoundedNumber("0", 1, 10)).toBeNull();
    expect(validateBoundedNumber("11", 1, 10)).toBeNull();
  });
});

describe("validateNewsCategory", () => {
  it("accepts valid categories", () => {
    expect(validateNewsCategory("general")).toBe("general");
    expect(validateNewsCategory("forex")).toBe("forex");
    expect(validateNewsCategory("crypto")).toBe("crypto");
    expect(validateNewsCategory("merger")).toBe("merger");
  });

  it("falls back to general for invalid", () => {
    expect(validateNewsCategory("invalid")).toBe("general");
    expect(validateNewsCategory("'; DROP TABLE")).toBe("general");
  });
});
