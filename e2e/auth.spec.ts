/**
 * Auth flows: sign-in errors, sign-up, route protection, callback errors, and session lifecycle.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel as sharedSel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

const sel = {
  ...sharedSel,
  email: 'input[name="email"]',
  password: 'input[name="password"]',
} as const;

// ─────────────────────────────────────────────────────────────────
// Sign-In
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-In', () => {
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));

    await expect(async () => {
      await page.locator(sel.email).fill('nonexistent@example.com');
      await expect(page.locator(sel.email)).toHaveValue('nonexistent@example.com');
      await page.locator(sel.password).fill('WrongPassword1!');
      await expect(page.locator(sel.password)).toHaveValue('WrongPassword1!');
      await page.locator(sel.submit).click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    await expect(page).toHaveURL(/\/sign-in/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Sign-Up
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-Up', () => {
  test('rejects weak password then succeeds with strong one', async ({ page }, testInfo) => {
    const signupEmail = scopedEmail('e2e-signup', testInfo.project.name);

    await deleteUserByEmail(signupEmail).catch(() => {});
    await page.goto(url(ROUTES.auth.signUp));
    await expect(page.locator(sel.submit)).toBeVisible({ timeout: 15_000 });

    // Weak password rejected client-side
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.password).fill('weak');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);

    // Successful sign-up with retry for webkit hydration
    await expect(async () => {
      await deleteUserByEmail(signupEmail).catch(() => {});
      await page.goto(url(ROUTES.auth.signUp), { timeout: 15_000 });

      const signupForm = page.locator('form', {
        has: page.locator('input[name="email"]'),
      });

      const submitBtn = signupForm.locator('button[type="submit"]');

      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
      await page.locator(sel.email).fill(signupEmail);
      await expect(page.locator(sel.email)).toHaveValue(signupEmail);
      await page.locator(sel.password).fill('StrongPass1!');
      await expect(page.locator(sel.password)).toHaveValue('StrongPass1!');
      await submitBtn.click();
      await expect(page.locator(`a[href*="${ROUTES.auth.signIn}"]`).first()).toBeVisible({
        timeout: 10_000,
      });
    }).toPass({ timeout: 45_000 });

    await deleteUserByEmail(signupEmail).catch(() => {});
  });
});

// ─────────────────────────────────────────────────────────────────
// Route Protection & Auth Callback
// ─────────────────────────────────────────────────────────────────
test.describe('Route Protection & Auth Callback', () => {
  test('protected routes redirect, public routes accessible', async ({ page }) => {
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

    for (const route of [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword]) {
      await page.goto(url(route));
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('invalid auth code redirects to sign-in with error', async ({ page }) => {
    await page.goto(url('/auth/callback'));
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
    await page.goto(url('/auth/callback') + '?code=invalid-code');
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────────────────────────
test.describe('Forgot Password', () => {
  test('submits reset email and shows confirmation', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-forgot-pw', testInfo.project.name);

    await ensureUser(email, E2E_PASSWORD);
    await page.goto(url(ROUTES.auth.forgotPassword));
    await expect(page.locator(sel.email)).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.locator(sel.email).fill(email);
      await expect(page.locator(sel.email)).toHaveValue(email);
      await page.locator(sel.submit).click();

      // After submission the form is replaced with a confirmation message
      // containing a link back to sign-in
      await expect(page.locator(`a[href*="${ROUTES.auth.signIn}"]`).first()).toBeVisible({
        timeout: 10_000,
      });
    }).toPass({ timeout: 30_000 });

    await deleteUserByEmail(email).catch(() => {});
  });
});

// ─────────────────────────────────────────────────────────────────
// Full Auth Lifecycle
// ─────────────────────────────────────────────────────────────────
test.describe('Full Auth Lifecycle', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-auth-lifecycle', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-auth-lifecycle', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('session → auth redirects → sign out → dashboard locked', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    await expect(async () => {
      const trigger = page.locator('button[aria-label="User menu"]');

      await expect(trigger).toBeVisible({ timeout: 5_000 });
      await trigger.click();

      const signOutBtn = page.locator('[data-testid="sign-out"]');

      await expect(signOutBtn).toBeVisible({ timeout: 3_000 });
      await signOutBtn.click();

      await page.waitForURL((u) => !u.pathname.includes('/dashboard'), { timeout: 15_000 });
    }).toPass({ timeout: 30_000 });

    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});
