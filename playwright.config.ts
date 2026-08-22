import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "./__tests__/e2e/env";
import { ADMIN_EMAIL } from "./__tests__/e2e/data";

// ═══════════════════════════════════════════════════════════════════════════════
// Browser end-to-end tests. ADDITIVE — the repo's unit tests stay on `node --test`
// (`npm run test:bootcamp`, `npm run test:competitions`) and Playwright never
// touches them: testDir is __tests__/e2e and testMatch is *.spec.ts, so the
// *.test.ts files node runs are invisible here and vice versa.
//
// The suite runs against a PRODUCTION BUILD (`next start`), not `next dev`. That
// is not a preference: proxy.ts short-circuits every /bootcamp URL to a 404 while
// BOOTCAMP_ENABLED is false, and the flag is a build-time constant, so what is
// being tested only exists in a build made with it on. `scripts/e2e/run.mjs`
// makes that build; running `npx playwright test` directly assumes one exists.
//
// SERIAL ON PURPOSE (workers: 1). The specs walk one applicant through one
// lifecycle — apply, accept, pay, enrol — so they share mutable server state and
// must run in order. Parallel workers would race each other through the same
// application row.
// ═══════════════════════════════════════════════════════════════════════════════

loadEnv();

const PORT = Number(process.env.E2E_PORT ?? 3123);
const BASE_URL = `http://127.0.0.1:${PORT}`;

// isAdminEmail() reads ADMIN_EMAILS at runtime, so the test admin is added for
// the server process only. Nothing in the repo or in .env.local changes.
const adminEmails = [process.env.ADMIN_EMAILS ?? "", ADMIN_EMAIL]
  .filter(Boolean)
  .join(",");

export default defineConfig({
  testDir: "./__tests__/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  globalSetup: "./__tests__/e2e/global-setup.ts",
  globalTeardown: "./__tests__/e2e/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // Every page is `force-dynamic` and talks to Supabase over the network from
    // a laptop, so a first paint can genuinely take a few seconds.
    navigationTimeout: 45_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
    env: { ADMIN_EMAILS: adminEmails },
  },
});
