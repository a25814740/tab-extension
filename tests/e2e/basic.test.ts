import { test, expect } from "@playwright/test";

test("preview app loads seeded workspace content", async ({ page }) => {
  await page.goto("/preview/index.html");

  await expect(page).toHaveTitle(/Taboard/);
  await expect(page.getByText("½Ð¥ýµn¤J")).toHaveCount(0);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("#root > *")).toHaveCount(1);
});
