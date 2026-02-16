/**
 * Simplified env for non-Next.js contexts (e.g. Playwright config).
 * The main env validation lives in `@/lib/common/env` and uses t3-env.
 * This file reads directly from process.env for tools that can't use t3-env.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

// Safety guard: prevent e2e tests from running against production Supabase.
// This check runs before any test because playwright.config.ts imports this file first.
if (SUPABASE_URL && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(SUPABASE_URL)) {
  throw new Error(
    `[e2e] NEXT_PUBLIC_SUPABASE_URL points to "${SUPABASE_URL}" which is NOT a local instance.\n` +
      `E2E tests must run against local Supabase (127.0.0.1 or localhost).\n` +
      `Ensure .env.local is present with NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321".`
  );
}

export const env = {
  CI: process.env.CI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};
