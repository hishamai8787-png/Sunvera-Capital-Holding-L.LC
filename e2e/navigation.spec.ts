import { test, expect } from "@playwright/test";

/**
 * Navigation E2E tests — verifies all pages load and have correct headings.
 */

test.describe("Navigation", () => {
  test("scanner page loads with heading", async ({ page }) => {
    await page.goto("/scanner");
    await expect(page).toHaveTitle(/Scanner/);
    await expect(page.getByRole("heading", { name: "Opportunity Scanner" })).toBeVisible();
  });

  test("clients page loads with heading", async ({ page }) => {
    await page.goto("/clients");
    await expect(page).toHaveTitle(/Clients/);
    await expect(page.getByRole("heading", { name: /Clients & Mandates/i })).toBeVisible();
  });

  test("playbooks page loads with heading", async ({ page }) => {
    await page.goto("/playbooks");
    await expect(page).toHaveTitle(/Playbooks/);
    await expect(page.getByRole("heading", { name: "Trade Playbooks" })).toBeVisible();
  });

  test("global guide page loads with heading", async ({ page }) => {
    await page.goto("/global");
    await expect(page).toHaveTitle(/Global/);
    await expect(page.getByRole("heading", { name: "Global Market Guide" })).toBeVisible();
  });

  test("login page loads with form and inputs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sunvera Analyst" })).toBeVisible();

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel("Password");
    await expect(passwordInput).toBeVisible();

    const submitButton = page.getByRole("button", { name: /Sign in/i });
    await expect(submitButton).toBeVisible();
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: /Page not found/i })).toBeVisible();
  });
});
