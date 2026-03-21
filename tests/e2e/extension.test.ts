import { test, expect } from "@playwright/test";

test("extension loads", async ({ context }) => {
  const page = await context.newPage();
  await page.goto("chrome://extensions");
  await expect(page).toHaveTitle(/Extensions/);
});

test("new tab loads dashboard", async ({ context }) => {
  const page = await context.newPage();
  const background = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(background.url()).host;
  await page.goto(`chrome-extension://${extensionId}/newtab/index.html`);
  await expect(page.getByText("Toby-like Dashboard")).toBeVisible();
});
