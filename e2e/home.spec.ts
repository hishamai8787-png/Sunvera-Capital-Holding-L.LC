import { test, expect } from "@playwright/test";

/**
 * Home page E2E tests — verifies core navigation, search, and rendering.
 */

test.describe("Home Page", () => {
  test("renders hero, search, and module cards", async ({ page }) => {
    await page.goto("/");

    // Title and heading
    await expect(page).toHaveTitle(/Sunvera Capital/);
    await expect(page.getByRole("heading", { name: /Research any company/i })).toBeVisible();

    // Search input is present and has correct ARIA
    const search = page.getByRole("combobox", { name: /Search for a company or ticker/i });
    await expect(search).toBeVisible();

    // Module cards
    await expect(page.getByRole("link", { name: /Equity Analysis/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Credit Proposals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Market Data Hub/i })).toBeVisible();
  });

  test("skip-to-content link appears on focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /Skip to main content/i });
    await expect(skipLink).toBeVisible();
  });

  test("example ticker links navigate to analyze page", async ({ page }) => {
    await page.goto("/");
    const aaplLink = page.getByRole("link", { name: "Analyze AAPL" });
    await expect(aaplLink).toBeVisible();
    await aaplLink.click();
    await expect(page).toHaveURL(/\/analyze\/AAPL/);
  });

  test("navigation bar has all sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: /Markets/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Playbooks/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Clients/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Scanner/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Global/i })).toBeVisible();
  });

  test("footer renders with company info", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toContainText("Sunvera Capital Holding LLC");
    await expect(footer).toContainText("not investment advice");
  });
});
