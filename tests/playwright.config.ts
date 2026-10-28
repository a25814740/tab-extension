import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["basic.test.ts", "creator.test.ts"],
  timeout: 60_000,
  use: {
    headless: true,
    trace: "retain-on-failure",
    baseURL: "http://127.0.0.1:4174",
  },
  webServer: {
    command:
      "pnpm --filter @toby/newtab build:preview && pnpm --filter @toby/creator build && node tests/scripts/serve-static.mjs docs 4174",
    url: "http://127.0.0.1:4174/preview/index.html",
    reuseExistingServer: true,
    cwd: "..",
    timeout: 120_000,
  },
});
