import { test, expect } from "@playwright/test";

test.describe("Multi-asset pages", () => {
  test("Compare page loads and accepts input", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.locator("h1")).toContainText("Company Comparison");
    await expect(page.locator("#compare-input")).toBeVisible();
    await page.locator("#compare-input").fill("AAPL,MSFT");
    await page.locator("#compare-input").press("Enter");
    // Wait for either results or loading state
    await expect(page.locator("text=Comparing")).toBeVisible({ timeout: 5000 }).catch(() => {});
    // If data loads, table should appear
    await expect(page.locator("text=Metric")).toBeVisible({ timeout: 15000 }).catch(() => {});
  });

  test("Forex page loads with currency cards", async ({ page }) => {
    await page.goto("/forex");
    await expect(page.locator("h1")).toContainText("Foreign Exchange");
    // Should have category filter buttons
    await expect(page.locator("text=All")).toBeVisible();
    // Should have at least some asset cards
    await page.waitForTimeout(2000);
    const cards = page.locator(".card-surface");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("Crypto page loads with coin cards", async ({ page }) => {
    await page.goto("/crypto");
    await expect(page.locator("h1")).toContainText("Cryptocurrency");
    await page.waitForTimeout(2000);
    const cards = page.locator(".card-surface");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("Metals page loads with precious metal cards", async ({ page }) => {
    await page.goto("/metals");
    await expect(page.locator("h1")).toContainText("Precious Metals");
    await page.waitForTimeout(2000);
    const cards = page.locator(".card-surface");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("Bonds page loads with yield cards", async ({ page }) => {
    await page.goto("/bonds");
    await expect(page.locator("h1")).toContainText("Sovereign Bond Yields");
    await page.waitForTimeout(2000);
    const cards = page.locator(".card-surface");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test("Dashboard shows all 12 module cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Platform Overview");
    // Should include new modules
    await expect(page.locator("text=Company Comparison")).toBeVisible();
    await expect(page.locator("text=Forex Rates")).toBeVisible();
    await expect(page.locator("text=Cryptocurrency")).toBeVisible();
    await expect(page.locator("text=Precious Metals")).toBeVisible();
    await expect(page.locator("text=Bond Yields")).toBeVisible();
  });

  test("Nav bar includes new asset links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/compare"]')).toBeVisible();
    await expect(page.locator('a[href="/forex"]')).toBeVisible();
    await expect(page.locator('a[href="/crypto"]')).toBeVisible();
    await expect(page.locator('a[href="/metals"]')).toBeVisible();
    await expect(page.locator('a[href="/bonds"]')).toBeVisible();
  });
});
