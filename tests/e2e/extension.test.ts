import { test, expect } from "@playwright/test";

test("extension loads", async ({ context }) => {
  const page = await context.newPage();
  await page.goto("chrome://extensions");
  await expect(page).toHaveTitle(/Extensions/);
});
