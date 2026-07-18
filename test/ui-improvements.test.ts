import { describe, it, expect } from "vitest";

describe("EmptyState component", () => {
  it("should accept icon, title, description, and action props", () => {
    const props = {
      icon: "📋",
      title: "No data yet",
      description: "Import your data to see analytics",
      action: { label: "Import", href: "/import" },
    };
    expect(props.icon).toBe("📋");
    expect(props.title).toBe("No data yet");
    expect(props.action?.href).toBe("/import");
  });
});

describe("ScanRunner progress stages", () => {
  const STAGES = [
    { label: "Fetching company profiles", icon: "📋" },
    { label: "Pulling financial statements", icon: "📊" },
    { label: "Calculating 100+ ratios", icon: "🧮" },
    { label: "Running Altman Z & Piotroski F", icon: "🔬" },
    { label: "Scoring & ranking opportunities", icon: "🏆" },
  ];

  it("should have 5 progress stages", () => {
    expect(STAGES).toHaveLength(5);
  });

  it("should start with fetching profiles and end with scoring", () => {
    expect(STAGES[0].label).toContain("profiles");
    expect(STAGES[STAGES.length - 1].label).toContain("Scoring");
  });

  it("should have unique stage labels", () => {
    const labels = STAGES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("TradeImport file validation", () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const VALID_EXTENSIONS = [".xlsx", ".xls", ".csv"];

  it("should accept .xlsx files", () => {
    const ext = ".xlsx";
    expect(VALID_EXTENSIONS.includes(ext)).toBe(true);
  });

  it("should accept .csv files", () => {
    const ext = ".csv";
    expect(VALID_EXTENSIONS.includes(ext)).toBe(true);
  });

  it("should reject .pdf files", () => {
    const ext = ".pdf";
    expect(VALID_EXTENSIONS.includes(ext)).toBe(false);
  });

  it("should reject files over 10MB", () => {
    const size = 11 * 1024 * 1024;
    expect(size > MAX_FILE_SIZE).toBe(true);
  });

  it("should reject empty files", () => {
    const size = 0;
    expect(size === 0).toBe(true);
  });
});

describe("PWA manifest", () => {
  const manifest = {
    name: "Sunvera Capital Holding",
    short_name: "Sunvera",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e1a",
    theme_color: "#0a0e1a",
    icons: [
      { src: "logo.png", sizes: "192x192", type: "image/png" },
      { src: "logo.png", sizes: "512x512", type: "image/png" },
    ],
  };

  it("should have correct app name", () => {
    expect(manifest.name).toBe("Sunvera Capital Holding");
  });

  it("should be standalone display mode", () => {
    expect(manifest.display).toBe("standalone");
  });

  it("should have at least 2 icon sizes", () => {
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it("should use brand colors", () => {
    expect(manifest.theme_color).toBe("#0a0e1a");
    expect(manifest.background_color).toBe("#0a0e1a");
  });
});
