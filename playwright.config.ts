import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

// Load environment variables BEFORE importing env.ts (validation runs on import)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

// Now safe to import env (validation will pass)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { env } = require(path.join(process.cwd(), 'src/lib/env'));

export default defineConfig({
  // Directory where E2E tests are located
  testDir: './e2e',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!env.CI,
  // Retry on CI only
  retries: env.CI ? 2 : 0,
  // Opt out of parallel tests on CI to avoid resource congestion
  ...(env.CI ? { workers: 1 } : {}),
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [['html', { outputFolder: 'reports/playwright/html' }]],
  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'reports/playwright/artifacts',
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: env.NEXT_PUBLIC_APP_URL,
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
  },
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Test against mobile viewports.
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  // Run your local dev server before starting the tests
  webServer: {
    // Command to start the server
    command: 'pnpm dev',
    // URL to wait for before starting tests
    url: env.NEXT_PUBLIC_APP_URL,
    // Whether to reuse an existing server instance (useful for local development)
    reuseExistingServer: !env.CI,
    // Timeout for server startup (Next.js cold start can be slow)
    timeout: 120_000,
    // Pipe stdout for debugging startup issues
    stdout: 'pipe',
  },
});
