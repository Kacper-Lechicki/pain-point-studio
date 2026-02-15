import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// Serial: 1 test per browser project at a time (max 5 concurrent).
test.describe.configure({ mode: 'serial' });

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  fullName: 'form#profile-form input[name="fullName"]',
  bio: 'textarea[name="bio"]',
  profileSubmit: 'form#profile-form button[type="submit"]',
  email: 'input[name="email"]',
  emailSubmit: 'form#email-form button[type="submit"]',
  currentPassword: 'input[name="currentPassword"]',
  password: 'input[name="password"]',
  confirmPassword: 'input[name="confirmPassword"]',
  passwordSubmit: 'form#password-form button[type="submit"]',
  deleteButton: 'button[data-variant="destructive"]:has(svg.lucide-trash-2)',
  confirmation: 'input[name="confirmation"]',
  toast: '[data-sonner-toast]',
} as const;

/** Profile form locators scoped to main content to avoid matching the Complete Profile modal. */
function profileInMain(page: import('@playwright/test').Page) {
  return page.getByRole('main');
}

const PASSWORD = 'E2eSettingsPass1!';

// ─────────────────────────────────────────────────────────────────
// Settings – Core Flow
// Profile update, route navigation, email validation
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Core Flow', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-core', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-core', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('profile update → section nav → email validation', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.settings.profile));
    await expect(page).toHaveURL(/\/settings\/profile/);

    // ── Profile section visible by default (scope to main to avoid Complete Profile modal) ──
    const main = profileInMain(page);
    await expect(main.locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
    await expect(main.locator(sel.bio)).toBeVisible();

    // ── Update profile ──
    await expect(async () => {
      const nameInput = main.locator(sel.fullName);
      await nameInput.click();
      await nameInput.fill('Test User');
      await expect(nameInput).toHaveValue('Test User');
    }).toPass({ timeout: 10_000 });

    // Submit and wait for success toast (retry for slow CI server actions)
    await expect(async () => {
      await main.locator(sel.profileSubmit).click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });

    // ── Navigate to email → verify pre-filled → reject invalid ──
    await page.goto(url(ROUTES.settings.email));
    await expect(page.locator(sel.email)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(sel.email)).toHaveValue(email);

    await page.locator(sel.email).clear();
    await page.locator(sel.email).fill('not-an-email');
    await page.locator(sel.emailSubmit).click();
    await expect(page).toHaveURL(/\/settings\/email/);
  });

  test('direct route navigation and browser back', async ({ page }) => {
    await signIn(page);

    // Direct route navigation to email
    await page.goto(url(ROUTES.settings.email));
    await expect(page.locator(sel.email)).toBeVisible({ timeout: 15_000 });

    // Navigate to password via route
    await page.goto(url(ROUTES.settings.password));
    await expect(page.locator(sel.password)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings\/password/);

    // Browser back returns to email
    await page.goBack();
    await expect(page).toHaveURL(/\/settings\/email/, { timeout: 10_000 });

    // Settings index redirects to profile
    await page.goto(url(ROUTES.common.settings));
    await expect(profileInMain(page).locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Password Update
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Password', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-password', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-password', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('rejects invalid → updates password successfully', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.settings.password));
    await expect(page.locator(sel.password)).toBeVisible({ timeout: 15_000 });

    // Weak password rejected (client-side Zod validation)
    await page.locator(sel.password).fill('weak');
    await page.locator(sel.confirmPassword).fill('weak');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings\/password/);

    // Mismatched passwords rejected (client-side Zod validation)
    await page.locator(sel.password).fill('NewStrongPass1!');
    await page.locator(sel.confirmPassword).fill('DifferentPass1!');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings\/password/);

    // Valid password update
    const cpwField = page.locator(sel.currentPassword);
    const pw = page.locator(sel.password);
    const cpw = page.locator(sel.confirmPassword);
    const newPassword = 'NewE2ePass1!';

    await expect(async () => {
      await cpwField.click();
      await cpwField.fill(PASSWORD);
      await expect(cpwField).toHaveValue(PASSWORD);
    }).toPass({ timeout: 10_000 });

    await expect(async () => {
      await pw.click();
      await pw.fill(newPassword);
      await expect(pw).toHaveValue(newPassword);
    }).toPass({ timeout: 10_000 });

    await expect(async () => {
      await cpw.click();
      await cpw.fill(newPassword);
      await expect(cpw).toHaveValue(newPassword);
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.passwordSubmit).click();

    // Success toast confirms the password was updated server-side.
    // Note: We intentionally don't assert field clearing — form.reset()
    // behaviour after server actions is unreliable on webkit-based
    // engines in CI (fields keep their DOM value despite React state reset).
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings\/password/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Delete Account
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Delete Account', () => {
  // Cleanup in case the test fails before the account is deleted via UI
  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-delete', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('dialog → cancel → confirm → delete → dashboard locked', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-settings-delete', testInfo.project.name);
    const signIn = makeApiSignIn(email, PASSWORD);

    await ensureUser(email, PASSWORD);
    await signIn(page);

    await page.goto(url(ROUTES.settings.dangerZone));
    await expect(page.locator(sel.deleteButton)).toBeVisible({ timeout: 15_000 });

    // Open dialog
    await page.locator(sel.deleteButton).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Delete button disabled without confirmation
    await expect(dialog.locator('button[type="submit"]')).toBeDisabled();

    // Cancel closes dialog
    await dialog.locator('[data-testid="delete-cancel"]').click();
    await expect(dialog).not.toBeVisible();

    // Reopen and delete
    await page.locator(sel.deleteButton).click();
    await expect(dialog).toBeVisible();

    await expect(async () => {
      const input = dialog.locator(sel.confirmation);
      await input.click();
      await input.fill(email);
      await expect(input).toHaveValue(email);
    }).toPass({ timeout: 10_000 });

    await expect(dialog.locator('button[type="submit"]')).toBeEnabled();
    await dialog.locator('button[type="submit"]').click();

    // The server action chain (list avatars → remove files → admin deleteUser → signOut)
    // is slow, then the client does router.push(home) + router.refresh().
    // Wait for the URL to leave /settings (the app redirects to home after deletion).
    await expect(page).not.toHaveURL(/\/settings/, { timeout: 45_000 });

    // Dashboard no longer accessible — session was invalidated by signOut + user deletion.
    // Use toPass because middleware may still accept the JWT briefly until refresh propagates.
    await expect(async () => {
      await page.goto(url(ROUTES.common.dashboard), { timeout: 15_000 });
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
    }).toPass({ timeout: 30_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Complete Profile Modal
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Complete Profile Modal', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-modal', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD, { fullName: '', role: '' });
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-modal', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('non-dismissable modal → fill form → modal disappears', async ({ page }) => {
    await signIn(page);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    // Cannot dismiss with Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    // Fill name
    await expect(async () => {
      const nameInput = dialog.locator('input[name="fullName"]');
      await nameInput.click();
      await nameInput.fill('Test User');
      await expect(nameInput).toHaveValue('Test User');
    }).toPass({ timeout: 10_000 });

    // Select role
    await dialog.locator('[data-testid="complete-profile-role"]').click();
    await page.locator('[role="option"]').first().click();

    // Submit
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
  });
});
