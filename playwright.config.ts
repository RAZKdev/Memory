import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: {
    command: "npm run start",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
