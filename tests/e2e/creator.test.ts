import { expect, test } from "@playwright/test";

test("creator dashboard shows login gate for anonymous users", async ({ page }) => {
  await page.goto("/creator/index.html#/", { waitUntil: "networkidle" });

  await expect(page).toHaveTitle(/Taboard Creator Portal/);
  await expect(page.getByText("登入後才可使用 Creator 後台")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeVisible();
});
