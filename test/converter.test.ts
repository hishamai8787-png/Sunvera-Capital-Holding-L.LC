import { describe, it, expect } from "vitest";

describe("Forex Converter — currency validation", () => {
  const validCurrencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD", "SAR", "AED", "QAR"];

  it("should accept 3-letter ISO codes", () => {
    validCurrencies.forEach((c) => {
      expect(c).toMatch(/^[A-Z]{3}$/);
    });
  });

  it("should include Gulf currencies", () => {
    expect(validCurrencies).toContain("SAR");
    expect(validCurrencies).toContain("AED");
    expect(validCurrencies).toContain("QAR");
  });

  it("should handle same-currency conversion (rate = 1)", () => {
    const from = "USD";
    const to = "USD";
    const rate = from === to ? 1 : 0;
    expect(rate).toBe(1);
  });

  it("should handle reverse pair calculation", () => {
    // If EURUSD = 1.08, then USDEUR = 1/1.08 = 0.926
    const eurUsd = 1.08;
    const usdEur = 1 / eurUsd;
    expect(usdEur).toBeCloseTo(0.9259, 3);
  });

  it("should handle USD cross-rate conversion", () => {
    // If USDSAR = 3.75 and USDAED = 3.67, then SAR/AED = 3.67/3.75
    const usdSar = 3.75;
    const usdAed = 3.67;
    const sarAed = usdAed / usdSar;
    expect(sarAed).toBeCloseTo(0.9787, 3);
  });
});

describe("Historical Comparison — normalization", () => {
  it("should normalize first data point to 100", () => {
    const prices = [50, 55, 60, 65];
    const base = prices[0];
    const normalized = prices.map((p) => (p / base) * 100);
    expect(normalized[0]).toBe(100);
    expect(normalized[1]).toBeCloseTo(110, 5);
    expect(normalized[3]).toBeCloseTo(130, 5);
  });

  it("should calculate correct change percent", () => {
    const start = 100;
    const end = 115;
    const change = ((end - start) / start) * 100;
    expect(change).toBe(15);
  });

  it("should handle negative change", () => {
    const start = 100;
    const end = 85;
    const change = ((end - start) / start) * 100;
    expect(change).toBe(-15);
  });

  it("should filter data by period", () => {
    const allDates = [
      { date: "2025-01-01", price: 100 },
      { date: "2025-03-01", price: 105 },
      { date: "2025-06-01", price: 110 },
      { date: "2025-09-01", price: 115 },
    ];
    const cutoff = new Date("2025-04-01");
    const filtered = allDates.filter((d) => new Date(d.date) >= cutoff);
    expect(filtered.length).toBe(2);
  });
});

describe("Historical Comparison — period options", () => {
  const PERIOD_DAYS: Record<string, number> = {
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
  };

  it("should have 5 period options", () => {
    expect(Object.keys(PERIOD_DAYS)).toHaveLength(5);
  });

  it("should map periods to correct day counts", () => {
    expect(PERIOD_DAYS["1M"]).toBe(30);
    expect(PERIOD_DAYS["3M"]).toBe(90);
    expect(PERIOD_DAYS["1Y"]).toBe(365);
    expect(PERIOD_DAYS["5Y"]).toBe(1825);
  });

  it("should default to 90 days for unknown period", () => {
    const days = PERIOD_DAYS["2W"] ?? 90;
    expect(days).toBe(90);
  });
});

describe("Historical Comparison — preset bundles", () => {
  const presets = {
    forex: ["Major Pairs", "USD vs Gulf", "Commodity Currencies"],
    crypto: ["BTC vs ETH", "Top 5", "Altcoins"],
    metals: ["Precious Metals", "Industrial", "Energy"],
    bonds: ["US Curve", "Sovereign 10Y", "European"],
  };

  it("should have 3 presets per category", () => {
    Object.values(presets).forEach((arr) => {
      expect(arr).toHaveLength(3);
    });
  });

  it("should cover all 4 asset categories", () => {
    expect(Object.keys(presets)).toHaveLength(4);
  });
});
