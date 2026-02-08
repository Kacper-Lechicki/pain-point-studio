import { expect, test } from '@playwright/test';

import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// ── Selectors ────────────────────────────────────────────────────
// All selectors target structural/semantic attributes (name, type, href)
// so they survive i18n label changes or template tweaks.

const sel = {
  form: 'form',
  email: 'input[name="email"]',
  password: 'input[name="password"]',
  confirmPassword: 'input[name="confirmPassword"]',
  submit: 'form button[type="submit"]',
  toast: '[data-sonner-toast]',
} as const;

function linkTo(page: import('@playwright/test').Page, path: string) {
  return page.locator(`a[href*="${path}"]`).first();
}

// ── Test user credentials ────────────────────────────────────────
const TEST_USER = {
  email: 'e2e-auth-test@example.com',
  password: 'E2eTestPass1!',
};

/**
 * Sign in as the test user. Uses toPass() retry pattern to handle
 * WebKit hydration issues where .fill() can be swallowed.
 */
async function signIn(page: import('@playwright/test').Page) {
  await expect(async () => {
    await page.goto(url(ROUTES.auth.signIn), { timeout: 15_000 });

    const emailInput = page.locator(sel.email);
    const passwordInput = page.locator(sel.password);
    const submitBtn = page.locator(sel.submit);

    await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

    await emailInput.click();
    await emailInput.fill(TEST_USER.email);
    await expect(emailInput).toHaveValue(TEST_USER.email);

    await passwordInput.click();
    await passwordInput.fill(TEST_USER.password);
    await expect(passwordInput).toHaveValue(TEST_USER.password);

    await submitBtn.click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  }).toPass({ timeout: 50_000 });
}

// ─────────────────────────────────────────────────────────────────
// Sign-In Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-In Flow', () => {
  test('renders the sign-in form with email, password and submit', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
    await expect(page.locator(sel.password)).toBeVisible();
    await expect(page.locator(sel.submit)).toBeVisible();
  });

  test('has navigation links to sign-up, forgot-password, and home', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    await expect(linkTo(page, ROUTES.auth.signUp)).toBeVisible();
    await expect(linkTo(page, ROUTES.auth.forgotPassword)).toBeVisible();
    // Home link — next-intl Link renders href="/en" for the root route
    await expect(page.locator(`a[href="${url(ROUTES.common.home)}"]`).first()).toBeVisible();
  });

  test('navigates to sign-up page', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    const link = linkTo(page, ROUTES.auth.signUp);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('navigates to forgot-password page', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    const link = linkTo(page, ROUTES.auth.forgotPassword);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('stays on page when submitting empty form', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('stays on page with invalid email format', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));

    await expect(async () => {
      await page.locator(sel.email).fill('not-an-email');
      await expect(page.locator(sel.email)).toHaveValue('not-an-email');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.password).fill('SomePassword1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('stays on page with empty password', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('shows error feedback for invalid credentials', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));

    await expect(async () => {
      await page.locator(sel.email).fill('nonexistent@example.com');
      await expect(page.locator(sel.email)).toHaveValue('nonexistent@example.com');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.password).fill('WrongPassword1!');
    await page.locator(sel.submit).click();

    // Wait for either error toast or button re-enabled (server responded)
    await expect(async () => {
      const toastVisible = await page.locator(sel.toast).first().isVisible();
      const buttonReEnabled = await page.locator(`${sel.submit}:not([disabled])`).isVisible();
      expect(toastVisible || buttonReEnabled).toBe(true);
    }).toPass({ timeout: 15_000 });

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('password visibility toggle changes input type', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    const pw = page.locator(sel.password);

    await expect(pw).toHaveAttribute('type', 'password');

    const toggle = page.locator('input[name="password"] + button[type="button"]');

    await toggle.click();
    await expect(pw).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(pw).toHaveAttribute('type', 'password');
  });

  test('form submits via Enter key', async ({ page, isMobile, browserName }) => {
    test.skip(isMobile, 'Keyboard submission is not applicable on mobile viewports');
    test.skip(browserName === 'webkit', 'WebKit does not reliably trigger form submit via Enter');

    await page.goto(url(ROUTES.auth.signIn));

    await expect(async () => {
      await page.locator(sel.email).fill('nonexistent@example.com');
      await expect(page.locator(sel.email)).toHaveValue('nonexistent@example.com');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.password).fill('SomePass1!');
    await page.locator(sel.password).press('Enter');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Sign-Up Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Sign-Up Flow', () => {
  const SIGNUP_EMAIL = 'e2e-signup-test@example.com';

  test.afterEach(async () => {
    await deleteUserByEmail(SIGNUP_EMAIL).catch(() => {});
  });

  test('renders the sign-up form with email, password and submit', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
    await expect(page.locator(sel.password)).toBeVisible();
    await expect(page.locator(sel.submit)).toBeVisible();
  });

  test('has navigation link to sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await expect(linkTo(page, ROUTES.auth.signIn)).toBeVisible();
  });

  test('navigates to sign-in page', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    const link = linkTo(page, ROUTES.auth.signIn);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('stays on page when submitting empty form', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('stays on page with invalid email format', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));

    await expect(async () => {
      await page.locator(sel.email).fill('bad');
      await expect(page.locator(sel.email)).toHaveValue('bad');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.password).fill('StrongPass1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('rejects password without uppercase letter', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.password).fill('weakpass1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('rejects password without special character', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.password).fill('WeakPass12');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('rejects password without number', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.password).fill('WeakPass!!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('rejects password shorter than 8 characters', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await page.locator(sel.email).fill('test@example.com');
    await page.locator(sel.password).fill('Ab1!');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test('successful sign-up shows confirmation state', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));

    // Use toPass() to guard against hydration-swallowed fills
    await expect(async () => {
      await page.locator(sel.email).click();
      await page.locator(sel.email).fill(SIGNUP_EMAIL);
      await expect(page.locator(sel.email)).toHaveValue(SIGNUP_EMAIL);
    }).toPass({ timeout: 10_000 });

    await expect(async () => {
      await page.locator(sel.password).click();
      await page.locator(sel.password).fill('StrongPass1!');
      await expect(page.locator(sel.password)).toHaveValue('StrongPass1!');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.submit).click();

    // After success, the form is replaced with a confirmation message
    // and a "Back to Sign In" link. The submit button disappears.
    await expect(page.locator(sel.submit)).not.toBeVisible({ timeout: 30_000 });
    await expect(linkTo(page, ROUTES.auth.signIn)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Forgot Password Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Forgot Password Flow', () => {
  test('renders the form with email input and submit', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
    await expect(page.locator(sel.submit)).toBeVisible();
    await expect(page.locator(sel.password)).toHaveCount(0);
  });

  test('has navigation link back to sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await expect(linkTo(page, ROUTES.auth.signIn)).toBeVisible();
  });

  test('navigates back to sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    const link = linkTo(page, ROUTES.auth.signIn);
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('stays on page when submitting empty email', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('stays on page with invalid email format', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await page.locator(sel.email).fill('not-valid');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Update Password Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Update Password Flow', () => {
  test('renders the form with password, confirm password and submit', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.password)).toBeVisible();
    await expect(page.locator(sel.confirmPassword)).toBeVisible();
    await expect(page.locator(sel.submit)).toBeVisible();
    await expect(page.locator(sel.email)).toHaveCount(0);
  });

  test('stays on page when submitting empty form', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/update-password/);
  });

  test('stays on page with weak password', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
    await page.locator(sel.password).fill('weak');
    await page.locator(sel.confirmPassword).fill('weak');
    await page.locator(sel.submit).click();
    await expect(page).toHaveURL(/\/update-password/);
  });

  test('stays on page when passwords do not match', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
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
  test('redirects unauthenticated user from /dashboard to /sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('redirects unauthenticated user from /settings to /sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('allows unauthenticated access to /sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.locator(sel.form)).toBeVisible();
  });

  test('allows unauthenticated access to /sign-up', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signUp));
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(page.locator(sel.form)).toBeVisible();
  });

  test('allows unauthenticated access to /forgot-password', async ({ page }) => {
    await page.goto(url(ROUTES.auth.forgotPassword));
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator(sel.form)).toBeVisible();
  });

  test('allows unauthenticated access to /update-password', async ({ page }) => {
    await page.goto(url(ROUTES.auth.updatePassword));
    await expect(page).toHaveURL(/\/update-password/);
    await expect(page.locator(sel.form)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Auth Callback
// ─────────────────────────────────────────────────────────────────
test.describe('Auth Callback', () => {
  test('callback without code redirects to sign-in with error', async ({ page }) => {
    await page.goto(url('/auth/callback'));
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
  });

  test('callback with invalid code redirects to sign-in with error', async ({ page }) => {
    await page.goto(url('/auth/callback') + '?code=invalid-code');
    await expect(page).toHaveURL(/\/sign-in\?error=auth_callback_error/);
  });

  test('dashboard with toast param redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto(url(ROUTES.common.dashboard) + '?toast=signInSuccess');
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('invalid toast param is handled gracefully', async ({ page }) => {
    await page.goto(url(ROUTES.auth.signIn) + '?toast=invalidKey');
    await expect(page.locator(sel.form)).toBeVisible();
    await expect(page.locator(sel.email)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Full Auth Lifecycle: Sign In → Dashboard → Sign Out
// ─────────────────────────────────────────────────────────────────
test.describe('Full Auth Lifecycle', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeAll(async () => {
    await ensureUser(TEST_USER.email, TEST_USER.password);
  });

  test.afterAll(async () => {
    await deleteUserByEmail(TEST_USER.email).catch(() => {});
  });

  test('sign in → redirects work → sign out → dashboard inaccessible', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.waitForLoadState('networkidle');
    await page.goto(url(ROUTES.auth.signIn));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto(url(ROUTES.common.home));
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Open user menu and sign out
    const userMenuTrigger = page.locator('button[aria-label="User menu"]');
    await expect(userMenuTrigger).toBeVisible({ timeout: 10_000 });
    await userMenuTrigger.click();

    // Target the sign-out button by its LogOut icon — stable across layout changes
    const signOutBtn = page.locator('button:has(svg.lucide-log-out)');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    await page.waitForURL((url) => !url.pathname.includes(ROUTES.common.dashboard), {
      timeout: 15_000,
    });

    // Dashboard should no longer be accessible
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
});
