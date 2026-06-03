import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Aa1!testpassword";

export const ACCOUNTS = {
  OWNER: "owner@demo.school",
  MANAGER: "manager@demo.school",
  SUPERVISOR: "supervisor@demo.school",
  TEACHER: "teacher@demo.school",
} as const;

export async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
}
