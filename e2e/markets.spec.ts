import { test, expect } from "@playwright/test";

/**
 * Markets page E2E tests — verifies TradingView widgets and watchlist render.
 * Uses CSS selectors instead of getByRole for headings, as TradingView
 * scripts can interfere with the accessibility tree in headless browsers.
 */

test.describe("Markets Page", () => {
  test("renders page header and sections", async ({ page }) => {
    const response = await page.goto("/markets", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/Markets/);

    // Use text locator instead of getByRole for the heading
    await expect(page.locator("h1").filter({ hasText: "Market Data Hub" })).toBeVisible({ timeout: 15000 });

    // Check section elements via aria-label
    await expect(page.locator('[aria-label="Market overview"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[aria-label="S&P 500 sector heatmap"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[aria-label="Foreign exchange cross rates"]')).toBeVisible({ timeout: 15000 });
  });

  test("watchlist section is present with add input", async ({ page }) => {
    const response = await page.goto("/markets", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();

    const watchlist = page.locator('[aria-label="Watchlist with live price updates"]');
    await expect(watchlist).toBeVisible({ timeout: 15000 });

    const addInput = page.getByLabel("Ticker symbol to add");
    await expect(addInput).toBeVisible({ timeout: 15000 });
  });

  test("can type in the watchlist add input", async ({ page }) => {
    const response = await page.goto("/markets", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBeTruthy();

    const addInput = page.getByLabel("Ticker symbol to add");
    await expect(addInput).toBeVisible({ timeout: 15000 });
    await addInput.fill("TSLA");
    await expect(addInput).toHaveValue("TSLA");
  });
});
