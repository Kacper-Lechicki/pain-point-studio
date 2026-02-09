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
    await page.goto(url(ROUTES.auth.signIn), { timeout: 15_000 });

    // WebKit hydration can reset form fields after fill — retry the
    // fill-and-submit sequence (without re-navigating) until dashboard.
    await expect(async () => {
      await page.locator('input[name="email"]').fill(email);
      await expect(page.locator('input[name="email"]')).toHaveValue(email);

      await page.locator('input[name="password"]').fill(password);
      await expect(page.locator('input[name="password"]')).toHaveValue(password);

      await page.locator('form button[type="submit"]').click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    }).toPass({ timeout: 30_000 });
  };
}
