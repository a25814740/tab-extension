import { test, expect } from "@playwright/test";

test("preview app loads seeded workspace content", async ({ page }) => {
  await page.goto("/preview/index.html");

  await expect(page).toHaveTitle(/Taboard/);
  await expect(page.getByText("請先登入")).toHaveCount(0);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("#root > *")).toHaveCount(1);
});
