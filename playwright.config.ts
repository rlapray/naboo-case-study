import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm e2e:server",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Must match e2e/global-setup.ts — isolated from the dev DB so test data
      // does not accumulate across runs (matters since listings paginate).
      MONGO_URI: "mongodb://localhost:27017/naboo_e2e",
      JWT_SECRET:
        process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
          ? process.env.JWT_SECRET
          : "e2e-jwt-secret-padding-xxxxxxxxxxxxxxxx",
      JWT_EXPIRATION_TIME: process.env.JWT_EXPIRATION_TIME ?? "3600",
    },
  },
});
