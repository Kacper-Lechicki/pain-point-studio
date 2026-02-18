/**
 * Auth flows: sign-in errors, sign-up, route protection, callback errors, and session lifecycle.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  submit: 'form button[type="submit"]',
  toast: '[data-sonner-toast]',
} as const;

const PASSWORD = 'E2eTestPass1!';

// ─────────────────────────────────────────────────────────────────
// Sign-In
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-In', () => {
  // Non-existent email → error toast, stays on sign-in page
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));

    // WebKit hydration can reset form fields after fill — retry the entire
    // fill-and-submit sequence until the server error toast appears.
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
  // Weak password rejected client-side, then full registration with cleanup
  test('rejects weak password then succeeds with strong one', async ({ page }, testInfo) => {
    const signupEmail = scopedEmail('e2e-signup', testInfo.project.name);
    await deleteUserByEmail(signupEmail).catch(() => {});

    await page.goto(url(ROUTES.auth.signUp));
    await expect(page.locator(sel.submit)).toBeVisible({ timeout: 15_000 });

    // One weak password check (sufficient — Zod validation is unit-tested)
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

      // Confirmation screen: form is replaced by success message with sign-in link
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
  // Unauthenticated: dashboard/settings → sign-in; auth pages → stay
  test('protected routes redirect, public routes accessible', async ({ page }) => {
    // Protected → redirect to sign-in
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/sign-in/);

    // Public → stay on page
    for (const route of [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword]) {
      await page.goto(url(route));
      await expect(page.locator('form')).toBeVisible();
    }
  });

  // Missing or invalid code param → auth_callback_error
  test('invalid auth code redirects to sign-in with error', async ({ page }) => {
    await page.goto(url('/auth/callback'));
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);

    await page.goto(url('/auth/callback') + '?code=invalid-code');
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
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
    signIn = makeApiSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-auth-lifecycle', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Full lifecycle: sign in → redirect from auth pages → sign out → locked
  test('session → auth redirects → sign out → dashboard locked', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // Authenticated user is redirected away from sign-in
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    // Sign out via user menu
    await expect(async () => {
      const trigger = page.locator('button[aria-label="User menu"]');
      await expect(trigger).toBeVisible({ timeout: 5_000 });
      await trigger.click();

      const signOutBtn = page.locator('[data-testid="sign-out"]');
      await expect(signOutBtn).toBeVisible({ timeout: 3_000 });
      await signOutBtn.click();

      await page.waitForURL((u) => !u.pathname.includes('/dashboard'), { timeout: 15_000 });
    }).toPass({ timeout: 30_000 });

    // Dashboard no longer accessible
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });
});
