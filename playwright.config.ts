import { defineConfig, devices } from "@playwright/test";

// Locally an existing server on this port is reused (reuseExistingServer), so stop other apps on 3000 first.
const port = process.env.PLAYWRIGHT_PORT ?? "3000";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const isCI = process.env.CI !== undefined;
const SWIFTSHADER = { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // Chromium draws WebGL with SwiftShader, so 3D works in headless runs.
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: SWIFTSHADER } },
    // Phones run the creator (Phase 6) and the world page (Phase 7).
    {
      name: "mobile-chrome",
      testMatch: /(creator|world)\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        launchOptions: SWIFTSHADER,
      },
    },
    {
      name: "mobile-safari",
      testMatch: /(creator|world)\.spec\.ts/,
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start --port ${port}`,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        // Builds /dev/** into this production build so axe and keyboard tests can reach /dev/ui.
        env: { DEV_ROUTES: "true" },
      },
});
