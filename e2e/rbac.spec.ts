import { expect, test } from "@playwright/test";

import { ACCOUNTS, login } from "./helpers";

test.describe("Authentication", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/students");
    await expect(page).toHaveURL(/\/login/);
  });

  test("rejects invalid credentials with a generic error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(ACCOUNTS.OWNER);
    await page.locator("#password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toContainText(/invalid/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test("each role can sign in", async ({ page }) => {
    for (const email of Object.values(ACCOUNTS)) {
      await login(page, email);
      await page.goto("/api/auth/signout");
      await page.context().clearCookies();
    }
  });
});

test.describe("RBAC — admin area", () => {
  test("OWNER sees Users + Audit nav and can open them", async ({ page }) => {
    await login(page, ACCOUNTS.OWNER);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await page.goto("/admin/audit");
    await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  });

  test("TEACHER cannot reach admin pages (redirected to /forbidden)", async ({ page }) => {
    await login(page, ACCOUNTS.TEACHER);
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/forbidden/);
    await page.goto("/admin/audit");
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("SUPERVISOR cannot reach admin pages", async ({ page }) => {
    await login(page, ACCOUNTS.SUPERVISOR);
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/forbidden/);
  });
});

test.describe("RBAC — sessions", () => {
  test("SUPERVISOR can assign sessions", async ({ page }) => {
    await login(page, ACCOUNTS.SUPERVISOR);
    await page.goto("/sessions");
    await expect(page.getByRole("link", { name: /Assign session/ })).toBeVisible();
  });

  test("TEACHER cannot assign sessions", async ({ page }) => {
    await login(page, ACCOUNTS.TEACHER);
    await page.goto("/sessions");
    await expect(page.getByRole("link", { name: /Assign session/ })).toHaveCount(0);
  });
});

test.describe("RBAC — student scoping", () => {
  test("OWNER sees all seeded students", async ({ page }) => {
    await login(page, ACCOUNTS.OWNER);
    await page.goto("/students");
    // Seed creates 10 students; first page shows up to 10.
    const rows = page.locator("tbody tr");
    await expect(rows).not.toHaveCount(0);
    await expect(page.getByText(/10 students/)).toBeVisible();
  });

  test("TEACHER sees only assigned students", async ({ page }) => {
    await login(page, ACCOUNTS.TEACHER);
    await page.goto("/students");
    await expect(page.getByText("Students assigned to you")).toBeVisible();
    const rows = page.locator("tbody tr");
    // Seed assigns exactly 3 students to the demo teacher.
    await expect(rows).toHaveCount(3);
  });
});
