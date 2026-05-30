import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:4177";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  outputDir: "output/playwright",
  reporter: "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_BASE_URL
      ? undefined
      : {
        command: "GUGU_FLASH_AI_DISABLED=1 npm run dev:web",
        url: `${baseURL}/apps/web/`,
        reuseExistingServer: true,
        timeout: 15_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
