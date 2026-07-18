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

test("about page loads with heading", async ({ page }) => {
  await page.goto("/about");
  await expect(page).toHaveTitle(/About/);
  await expect(page.getByRole("heading", { name: /Research like an institution/i })).toBeVisible();
});

test("contact page loads with form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveTitle(/Contact/);
  await expect(page.getByRole("heading", { name: /Get in Touch/i })).toBeVisible();
  await expect(page.getByLabel("Full Name")).toBeVisible();
  await expect(page.getByLabel("Email Address")).toBeVisible();
});

test("terms page loads", async ({ page }) => {
  await page.goto("/terms");
  await expect(page).toHaveTitle(/Terms/);
  await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
});

test("privacy page loads", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page).toHaveTitle(/Privacy/);
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
});

test("settings page loads", async ({ page }) => {
  await page.goto("/settings");
  await expect(page).toHaveTitle(/Settings/);
  await expect(page.getByRole("heading", { name: "Preferences" })).toBeVisible();
});

test("dashboard page loads with module cards", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveTitle(/Dashboard/);
  await expect(page.getByRole("heading", { name: /Platform Overview/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Equity Analysis/i })).toBeVisible();
});

test("health check returns ok status", async ({ page }) => {
  const response = await page.goto("/api/health");
  expect(response?.ok()).toBeTruthy();
  const body = await response!.json();
  expect(body.status).toBe("ok");
  expect(body.services).toBeDefined();
});
