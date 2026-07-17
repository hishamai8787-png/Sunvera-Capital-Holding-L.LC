import { test, expect } from "@playwright/test";

/**
 * Markets page E2E tests — verifies TradingView widgets and watchlist render.
 */

test.describe("Markets Page", () => {
  test("renders page header and sections", async ({ page }) => {
    await page.goto("/markets");

    await expect(page).toHaveTitle(/Markets/);
    await expect(page.getByRole("heading", { name: "Market Data Hub" })).toBeVisible();

    // TradingView sections should have aria-labels
    await expect(page.getByRole("region", { name: /Market overview/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /S&P 500 sector heatmap/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /Foreign exchange cross rates/i })).toBeVisible();
  });

  test("watchlist section is present with add input", async ({ page }) => {
    await page.goto("/markets");

    const watchlist = page.getByRole("region", { name: /Watchlist/i });
    await expect(watchlist).toBeVisible();

    const addInput = page.getByLabel("Ticker symbol to add");
    await expect(addInput).toBeVisible();
  });

  test("can type in the watchlist add input", async ({ page }) => {
    await page.goto("/markets");

    const addInput = page.getByLabel("Ticker symbol to add");
    await addInput.fill("TSLA");
    await expect(addInput).toHaveValue("TSLA");
  });
});
