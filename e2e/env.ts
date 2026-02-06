/**
 * Simplified env for non-Next.js contexts (e.g. Playwright config).
 * The main env validation lives in `@/lib/common/env` and uses t3-env.
 * This file reads directly from process.env for tools that can't use t3-env.
 */
export const env = {
  CI: process.env.CI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
};
