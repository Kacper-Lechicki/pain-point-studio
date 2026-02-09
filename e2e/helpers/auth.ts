import { expect } from '@playwright/test';

import { ROUTES, url } from './routes';

const DEFAULT_PASSWORD = 'E2eTestPass1!';

/**
 * Generates a project-scoped email to prevent collisions when
 * multiple Playwright projects run against the same Supabase instance.
 */
export function scopedEmail(base: string, projectName: string) {
  const slug = projectName.toLowerCase().replace(/\s+/g, '-');

  return `${base}+${slug}@example.com`;
}

/**
 * Returns a reusable sign-in function for the given email/password.
 * Uses toPass() to handle WebKit hydration issues where .fill()
 * can be swallowed during first render.
 */
export function makeSignIn(email: string, password = DEFAULT_PASSWORD) {
  return async function signIn(page: import('@playwright/test').Page) {
    // Retry the full navigate → fill → submit sequence.
    // Re-navigating on each attempt resets form state (error toasts,
    // disabled buttons) which is critical on CI where GoTrue can be slow.
    // On a production build the navigation cost is negligible (~200ms).
    await expect(async () => {
      // If a previous retry's submit succeeded late, we may already be
      // on the dashboard — skip the whole sequence in that case.
      if (page.url().includes('/dashboard')) {return;}

      await page.goto(url(ROUTES.auth.signIn), { timeout: 15_000 });

      // Wait for the form to be interactive (hydrated).
      const submitBtn = page.locator('form button[type="submit"]');
      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

      await page.locator('input[name="email"]').fill(email);
      await expect(page.locator('input[name="email"]')).toHaveValue(email);

      await page.locator('input[name="password"]').fill(password);
      await expect(page.locator('input[name="password"]')).toHaveValue(password);

      await submitBtn.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    }).toPass({ timeout: 60_000 });
  };
}
