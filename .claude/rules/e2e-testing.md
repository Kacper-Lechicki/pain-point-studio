---
description: Playwright E2E testing patterns, WebKit quirks, selector strategy
paths:
  - 'e2e/**'
  - 'playwright.config.ts'
  - 'src/test-utils/**'
---

# E2E Testing Rules

## Selector Strategy

- Use structural selectors (`input[name="email"]`, `button[type="submit"]`) over text/label selectors for i18n resilience
- Toast assertions: use `[data-sonner-toast]` selector (Sonner)
- Avoid `.or()` with locators that both resolve — causes Playwright strict mode violations

## WebKit Quirks

- WebKit `.fill()` can be swallowed during hydration — wrap in `toPass()` retry pattern:
  ```ts
  await expect(async () => {
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }).toPass();
  ```

## Performance Under Load

- Minimize `signIn()` calls — Supabase GoTrue rate-limits auth endpoints
- Combine related assertions into single tests rather than splitting into many small tests
- `ensureUser()` helper needs retry logic for parallel Playwright projects (Chromium + WebKit run concurrently)

## Server Actions

- Server actions POST to the current page URL, not a separate action endpoint
- When intercepting network requests in tests, match against the page URL with POST method

## Configuration

- 2 projects: Chromium + WebKit (Firefox omitted)
- 2 workers (balances parallelism vs. Turbopack dev server stability)
- Timeout: 60s locally, 90s on CI
- Artifacts: `reports/playwright/` (HTML reports, videos, traces)
