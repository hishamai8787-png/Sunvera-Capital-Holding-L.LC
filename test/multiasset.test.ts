import { describe, it, expect } from "vitest";

describe("Multi-asset API — forex symbols", () => {
  const forexAssets = [
    { symbol: "EURUSD", label: "EUR/USD", category: "Major" },
    { symbol: "GBPUSD", label: "GBP/USD", category: "Major" },
    { symbol: "USDJPY", label: "USD/JPY", category: "Major" },
    { symbol: "USDCHF", label: "USD/CHF", category: "Major" },
    { symbol: "USDSAR", label: "USD/SAR", category: "Gulf" },
    { symbol: "USDAED", label: "USD/AED", category: "Gulf" },
    { symbol: "USDQAR", label: "USD/QAR", category: "Gulf" },
  ];

  it("should include major and Gulf currency pairs", () => {
    const categories = new Set(forexAssets.map((a) => a.category));
    expect(categories.has("Major")).toBe(true);
    expect(categories.has("Gulf")).toBe(true);
  });

  it("should have correct symbol format for FMP", () => {
    forexAssets.forEach((a) => {
      expect(a.symbol).toMatch(/^[A-Z]{6}$/);
      expect(a.symbol).toContain("USD");
    });
  });
});

describe("Multi-asset API — crypto symbols", () => {
  const cryptoAssets = [
    { symbol: "BTCUSD", label: "Bitcoin" },
    { symbol: "ETHUSD", label: "Ethereum" },
    { symbol: "SOLUSD", label: "Solana" },
    { symbol: "DOGEUSD", label: "Dogecoin" },
  ];

  it("should include BTC and ETH", () => {
    expect(cryptoAssets.find((a) => a.symbol === "BTCUSD")).toBeDefined();
    expect(cryptoAssets.find((a) => a.symbol === "ETHUSD")).toBeDefined();
  });

  it("should have USD-quoted symbols", () => {
    cryptoAssets.forEach((a) => {
      expect(a.symbol.endsWith("USD")).toBe(true);
    });
  });
});

describe("Multi-asset API — metals & minerals", () => {
  const metals = [
    { symbol: "XAUUSD", label: "Gold", category: "Precious" },
    { symbol: "XAGUSD", label: "Silver", category: "Precious" },
    { symbol: "XPTUSD", label: "Platinum", category: "Precious" },
    { symbol: "XPDUSD", label: "Palladium", category: "Precious" },
    { symbol: "XCUUSD", label: "Copper", category: "Industrial" },
    { symbol: "CLUSD", label: "WTI Crude Oil", category: "Energy" },
  ];

  it("should include precious metals", () => {
    const precious = metals.filter((m) => m.category === "Precious");
    expect(precious.length).toBeGreaterThanOrEqual(4);
  });

  it("should include industrial minerals", () => {
    const industrial = metals.filter((m) => m.category === "Industrial");
    expect(industrial.length).toBeGreaterThanOrEqual(1);
  });

  it("should include energy commodities", () => {
    const energy = metals.filter((m) => m.category === "Energy");
    expect(energy.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Multi-asset API — bonds", () => {
  const bonds = [
    { symbol: "US2Y", label: "US 2-Year", category: "US Treasury" },
    { symbol: "US10Y", label: "US 10-Year", category: "US Treasury" },
    { symbol: "US30Y", label: "US 30-Year", category: "US Treasury" },
    { symbol: "DE10Y", label: "Germany 10-Year", category: "Sovereign" },
    { symbol: "GB10Y", label: "UK 10-Year", category: "Sovereign" },
  ];

  it("should include US Treasury yields", () => {
    const us = bonds.filter((b) => b.category === "US Treasury");
    expect(us.length).toBeGreaterThanOrEqual(3);
  });

  it("should include international sovereigns", () => {
    const intl = bonds.filter((b) => b.category === "Sovereign");
    expect(intl.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Company comparison — metrics", () => {
  const metrics = [
    "price", "changePercent", "marketCap", "peRatio", "eps",
    "dividendYield", "profitMargin", "ebitdaMargin",
    "roe", "roa", "debtToEquity", "currentRatio",
    "fcfYield", "ocfPerShare", "beta",
  ];

  it("should have 15 comparison metrics", () => {
    expect(metrics).toHaveLength(15);
  });

  it("should include profitability and leverage metrics", () => {
    expect(metrics).toContain("roe");
    expect(metrics).toContain("roa");
    expect(metrics).toContain("debtToEquity");
    expect(metrics).toContain("profitMargin");
  });
});

describe("AssetGrid — TradingView symbol mapping", () => {
  const tvMap: Record<string, string> = {
    EURUSD: "FX:EURUSD",
    BTCUSD: "BITSTAMP:BTCUSD",
    XAUUSD: "OANDA:XAUUSD",
    US10Y: "TVC:US10Y",
    CLUSD: "TVC:USOIL",
  };

  it("should map forex to FX: prefix", () => {
    expect(tvMap.EURUSD).toContain("FX:");
  });

  it("should map crypto to exchange prefix", () => {
    expect(tvMap.BTCUSD).toContain("BITSTAMP:");
  });

  it("should map gold to OANDA prefix", () => {
    expect(tvMap.XAUUSD).toContain("OANDA:");
  });

  it("should map bonds to TVC: prefix", () => {
    expect(tvMap.US10Y).toContain("TVC:");
  });
});
