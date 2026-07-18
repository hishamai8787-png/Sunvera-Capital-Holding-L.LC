import { test, expect } from "@playwright/test";

/**
 * Markets page E2E tests — verifies TradingView widgets and watchlist render.
 */

test.describe("Markets Page", () => {
  test("renders page header and sections", async ({ page }) => {
    const response = await page.goto("/markets");
    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/Markets/);
    await expect(page.getByRole("heading", { name: "Market Data Hub" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: /Market overview/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: /S&P 500 sector heatmap/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("region", { name: /Foreign exchange cross rates/i })).toBeVisible({ timeout: 15000 });
  });

  test("watchlist section is present with add input", async ({ page }) => {
    const response = await page.goto("/markets");
    expect(response?.ok()).toBeTruthy();

    const watchlist = page.getByRole("region", { name: /Watchlist/i });
    await expect(watchlist).toBeVisible({ timeout: 15000 });

    const addInput = page.getByLabel("Ticker symbol to add");
    await expect(addInput).toBeVisible({ timeout: 15000 });
  });

  test("can type in the watchlist add input", async ({ page }) => {
    const response = await page.goto("/markets");
    expect(response?.ok()).toBeTruthy();

    const addInput = page.getByLabel("Ticker symbol to add");
    await expect(addInput).toBeVisible({ timeout: 15000 });
    await addInput.fill("TSLA");
    await expect(addInput).toHaveValue("TSLA");
  });
});
