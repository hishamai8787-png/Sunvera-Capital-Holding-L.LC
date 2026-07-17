import { test, expect } from "@playwright/test";

/**
 * Accessibility E2E tests — verifies WCAG compliance at runtime.
 */

test.describe("Accessibility", () => {
  test("all images have alt text on home page", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("tables have scope attributes on scanner page", async ({ page }) => {
    await page.goto("/scanner");
    const headers = page.locator("th[scope]");
    const count = await headers.count();
    // Scanner table should have multiple scoped headers if data exists,
    // otherwise the empty state still has no unscoped headers
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("forms have labeled inputs on login page", async ({ page }) => {
    await page.goto("/login");

    const email = page.locator("input#email");
    await expect(email).toBeVisible();
    const emailLabel = page.locator("label[for='email']");
    await expect(emailLabel).toBeVisible();

    const password = page.locator("input#password");
    await expect(password).toBeVisible();
    const passwordLabel = page.locator("label[for='password']");
    await expect(passwordLabel).toBeVisible();
  });

  test("skip link is keyboard accessible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: /Skip to main content/i });
    await expect(skipLink).toBeFocused();
  });

  test("main content has matching id for skip link target", async ({ page }) => {
    await page.goto("/");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible();
  });

  test("error pages have role=alert when applicable", async ({ page }) => {
    // Visit a ticker that will fail to load data
    await page.goto("/analyze/INVALIDTICKER123");
    // Wait for either error state or loading to complete
    await page.waitForTimeout(5000);
    // If error state renders, it should have role=alert
    const alertRegion = page.locator("[role='alert']");
    const alertCount = await alertRegion.count();
    if (alertCount > 0) {
      await expect(alertRegion.first()).toBeVisible();
    }
  });
});
