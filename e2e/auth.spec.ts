import { expect, test } from '@playwright/test';

import { makeSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  form: 'form',
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  confirmPassword: 'input[name="confirmPassword"]',
  submit: 'form button[type="submit"]',
  toast: '[data-sonner-toast]',
} as const;

const PASSWORD = 'E2eTestPass1!';

// ─────────────────────────────────────────────────────────────────
// Sign-In Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-In Flow', () => {
  test('renders form and rejects invalid input', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));

    // Form renders correctly
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
    await expect(page.locator(sel.password)).toBeVisible();
    await expect(page.locator(sel.submit)).toBeVisible();

    // Empty submit stays on page
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-in/);

    // Invalid email stays on page
    await page.locator(sel.email).fill('not-an-email');
    await page.locator(sel.password).fill('SomePassword1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

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

      // Server responds with error toast
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    await expect(page).toHaveURL(/\/sign-in/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Sign-Up Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-Up Flow', () => {
  test('rejects weak passwords', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await expect(page.locator(sel.form)).toBeVisible();

    // Empty submit stays on page
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);

    // Each weak password variant is rejected
    const weakPasswords = ['weakpass1!', 'WeakPass12', 'WeakPass!!', 'Ab1!'];

    for (const pw of weakPasswords) {
      await page.locator(sel.email).fill('test@example.com');
      await page.locator(sel.password).fill(pw);
      await page.locator(sel.submit).click();
      await expect(page).toHaveURL(/\/sign-up/);
    }
  });

  test('successful sign-up shows confirmation', async ({ page }, testInfo) => {
    const signupEmail = scopedEmail('e2e-signup', testInfo.project.name);

    // WebKit hydration can reset form fields after fill — retry the entire
    // fill-and-submit sequence until the confirmation screen appears.
    await expect(async () => {
      // Clean up any leftover user from a previous retry
      await deleteUserByEmail(signupEmail).catch(() => {});

      await page.goto(url(ROUTES.auth.signUp), { timeout: 15_000 });

      await page.locator(sel.email).fill(signupEmail);
      await expect(page.locator(sel.email)).toHaveValue(signupEmail);

      await page.locator(sel.password).fill('StrongPass1!');
      await expect(page.locator(sel.password)).toHaveValue('StrongPass1!');

      await page.locator(sel.submit).click();

      // Confirmation screen: submit button disappears
      await expect(page.locator(sel.submit)).not.toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    await expect(page.locator(`a[href*="${ROUTES.auth.signIn}"]`).first()).toBeVisible();

    // Clean up test user
    await deleteUserByEmail(signupEmail).catch(() => {});
  });
});

// ─────────────────────────────────────────────────────────────────
// Forgot & Update Password
// ─────────────────────────────────────────────────────────────────
test.describe('Forgot Password Flow', () => {
  test('renders form and rejects invalid input', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
    await expect(page.locator(sel.password)).toHaveCount(0);

    // Empty and invalid email stay on page
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/forgot-password/);

    await page.locator(sel.email).fill('not-valid');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Update Password Flow', () => {
  test('renders form and rejects invalid input', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.password)).toBeVisible();
    await expect(page.locator(sel.confirmPassword)).toBeVisible();
    await expect(page.locator(sel.email)).toHaveCount(0);

    // Empty, weak, and mismatched passwords stay on page
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/update-password/);

    await page.locator(sel.password).fill('weak');
    await page.locator(sel.confirmPassword).fill('weak');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/update-password/);

    await page.locator(sel.password).fill('StrongPass1!');
    await page.locator(sel.confirmPassword).fill('DifferentPass1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/update-password/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Route Protection
// ─────────────────────────────────────────────────────────────────
test.describe('Route Protection', () => {
  test('protected routes redirect, public routes are accessible', async ({ page }) => {
    // Protected → redirect to sign-in
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/);

    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/sign-in/);

    // Public → stay on page with form
    for (const route of [
      ROUTES.auth.signIn,
      ROUTES.auth.signUp,
      ROUTES.auth.forgotPassword,
      ROUTES.auth.updatePassword,
    ]) {
      await page.goto(url(route));
      await expect(page.locator(sel.form)).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// Auth Callback
// ─────────────────────────────────────────────────────────────────
test.describe('Auth Callback', () => {
  test('invalid or missing code redirects to sign-in with error', async ({ page }) => {
    await page.goto(url('/auth/callback'));
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);

    await page.goto(url('/auth/callback') + '?code=invalid-code');
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
  });

  test('invalid toast param is handled gracefully', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn) + '?toast=invalidKey');
    await expect(page.locator(sel.form)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Full Auth Lifecycle: Sign In → Redirects → Sign Out
// ─────────────────────────────────────────────────────────────────
test.describe('Full Auth Lifecycle', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-auth-lifecycle', testInfo.project.name);
    signIn = makeSignIn(email);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-auth-lifecycle', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('sign in → auth redirects → sign out → dashboard locked', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // Authenticated user is redirected away from sign-in
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Sign out via user menu
    await expect(async () => {
      const trigger = page.locator('button[aria-label="User menu"]');
      await expect(trigger).toBeVisible({ timeout: 5_000 });
      await trigger.click();

      const signOutBtn = page.locator('[data-testid="sign-out"]');
      await expect(signOutBtn).toBeVisible({ timeout: 3_000 });
      await signOutBtn.click();

      await page.waitForURL((u) => !u.pathname.includes('/dashboard'), { timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    // Dashboard no longer accessible
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
});
