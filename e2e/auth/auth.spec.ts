import { expect, test } from '../fixtures';
import { fillField } from '../helpers/actions';
import { scopedEmail } from '../helpers/auth';
import { ROUTES, url } from '../helpers/routes';
import { E2E_PASSWORD, sel } from '../helpers/selectors';
import { deleteUserByEmail, ensureUser } from '../helpers/supabase-admin';

test.describe('Sign-In', () => {
  test('shows error for invalid credentials @webkit', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn), { waitUntil: 'networkidle' });
    await expect(page.locator(sel.emailInput)).toBeVisible({ timeout: 15_000 });
    await fillField(page.locator(sel.emailInput), 'nonexistent@example.com');
    await fillField(page.locator(sel.passwordInput), 'WrongPassword1!');
    await page.locator(sel.submit).click();
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe('Sign-Up', () => {
  test('rejects weak password then succeeds with strong one @webkit', async ({
    page,
  }, testInfo) => {
    const signupEmail = scopedEmail('e2e-signup', testInfo.project.name);
    await deleteUserByEmail(signupEmail).catch(() => {});

    try {
      await page.goto(url(ROUTES.auth.signUp), { waitUntil: 'networkidle' });
      await expect(page.locator(sel.submit)).toBeVisible({ timeout: 15_000 });
      await fillField(page.locator(sel.emailInput), 'test@example.com');
      await fillField(page.locator(sel.passwordInput), 'weak');
      await page.locator(sel.submit).click();
      await expect(page).toHaveURL(/\/sign-up/);
      await deleteUserByEmail(signupEmail).catch(() => {});
      await page.goto(url(ROUTES.auth.signUp), { waitUntil: 'networkidle', timeout: 15_000 });

      const submitBtn = page
        .locator('form')
        .filter({ has: page.locator(sel.emailInput) })
        .locator('button[type="submit"]');

      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });
      await fillField(page.locator(sel.emailInput), signupEmail);
      await fillField(page.locator(sel.passwordInput), 'StrongPass1!');
      await submitBtn.click();

      await expect(page.locator(`a[href*="${ROUTES.auth.signIn}"]`).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteUserByEmail(signupEmail).catch(() => {});
    }
  });
});

test.describe('Route Protection & Auth Callback', () => {
  test('protected routes redirect, public routes accessible', async ({ page }) => {
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });

    for (const route of [ROUTES.auth.signIn, ROUTES.auth.signUp, ROUTES.auth.forgotPassword]) {
      await page.goto(url(route));
      await expect(page.locator('form')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('invalid auth code redirects to sign-in', async ({ page }) => {
    const noCodeResp = await page.goto(url('/auth/callback'));
    await expect(page).toHaveURL(/\/sign-in/);

    expect(noCodeResp?.url()).toMatch(/\/sign-in/);

    const invalidCodeResp = await page.goto(url('/auth/callback') + '?code=invalid-code');
    await expect(page).toHaveURL(/\/sign-in/);

    expect(invalidCodeResp?.url()).toMatch(/\/sign-in/);
  });
});

test.describe('Forgot Password', () => {
  test('submits reset email and shows confirmation', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-forgot-pw', testInfo.project.name);
    await ensureUser(email, E2E_PASSWORD);

    try {
      await page.goto(url(ROUTES.auth.forgotPassword), { waitUntil: 'networkidle' });
      await expect(page.locator(sel.emailInput)).toBeVisible({ timeout: 15_000 });

      await fillField(page.locator(sel.emailInput), email);
      await page.locator(sel.submit).click();

      await expect(page.locator(`a[href*="${ROUTES.auth.signIn}"]`).first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await deleteUserByEmail(email).catch(() => {});
    }
  });
});

test.describe('Auth Lifecycle', () => {
  test('session -> auth redirects -> sign out -> dashboard locked @webkit', async ({
    page,
    authenticatedPage: {},
  }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

    const trigger = page.locator('button[aria-label="User menu"]');

    await expect(trigger).toBeVisible({ timeout: 5_000 });
    await trigger.click();

    const signOutBtn = page.locator('[data-testid="sign-out"]');

    await expect(signOutBtn).toBeVisible({ timeout: 3_000 });
    await signOutBtn.click();
    await page.waitForURL((u) => !u.pathname.includes('/dashboard'), { timeout: 15_000 });
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  });

  test('authenticated user on homepage redirects to dashboard', async ({
    page,
    authenticatedPage: {},
  }) => {
    await page.goto(url('/'));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  });
});
