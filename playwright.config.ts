import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { env } = require(path.join(process.cwd(), 'e2e/helpers/env'));

const PORT = process.env.PORT;
const baseURL = PORT ? `http://localhost:${PORT}` : env.NEXT_PUBLIC_APP_URL;

export default defineConfig({
  // Directory where E2E tests are located
  testDir: './e2e',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!env.CI,
  // Retry on CI only (1 retry is enough with stable GoTrue rate limits)
  retries: env.CI ? 1 : 0,
  // Limit parallelism: CI has 2 vCPUs; locally Turbopack dev server
  // struggles with 5+ concurrent browsers (JSON parse errors, 500s).
  workers: 2,
  // Per-test timeout (60s locally, 90s on CI — GoTrue can be slow under load)
  timeout: env.CI ? 90_000 : 60_000,
  // Global expect assertion timeout
  expect: { timeout: env.CI ? 10_000 : 5_000 },
  // Reporter: html for artifact upload + list on CI for live progress in logs
  reporter: env.CI
    ? [['list'], ['html', { outputFolder: 'reports/playwright/html' }]]
    : [['html', { outputFolder: 'reports/playwright/html' }]],
  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'reports/playwright/artifacts',
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL,
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    // Navigation timeout (30s to handle parallel project load on dev server)
    navigationTimeout: 30_000,
  },
  // Configure projects for major browsers.
  // 3 projects: desktop engines (chromium + webkit) + mobile viewport (Mobile Chrome).
  // Firefox is omitted (minimal unique coverage vs chromium).
  // Mobile Safari is omitted (webkit already catches engine bugs; Mobile Chrome covers viewport).
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Run your local dev server before starting the tests
  webServer: {
    // Use production server on CI (pre-built), dev server locally
    command: env.CI ? 'pnpm start' : 'pnpm dev',
    // URL to wait for before starting tests
    url: baseURL,
    // Whether to reuse an existing server instance (useful for local development)
    // If PORT is specified, we assume a dedicated run and do not reuse (forces cleanup)
    reuseExistingServer: !env.CI && !PORT,
    // Timeout for server startup (Next.js cold start can be slow)
    timeout: 120_000,
    // Pipe stdout for debugging startup issues
    stdout: 'pipe',
  },
});
