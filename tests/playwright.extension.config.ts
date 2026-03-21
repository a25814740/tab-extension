import { defineConfig } from "@playwright/test";
import path from "node:path";

const extensionPath = path.resolve(__dirname, "../extension");

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["extension.test.ts"],
  timeout: 120_000,
  use: {
    headless: false,
    launchOptions: {
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    },
  },
});
