import { expect, test } from '@playwright/test';

import { makeSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, SECTION_TO_HASH, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// Serial: 1 test per browser project at a time (max 5 concurrent).
test.describe.configure({ mode: 'serial' });

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  navTabs: '[data-testid="settings-nav"]',
  navSelect: '[data-testid="settings-nav-select"]',
  fullName: 'input[name="fullName"]',
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

const PASSWORD = 'E2eSettingsPass1!';

/**
 * Navigate to a settings section (desktop tabs or mobile select).
 * Retries to survive hydration layout flips.
 */
async function navigateToSection(
  page: import('@playwright/test').Page,
  section: 'profile' | 'email' | 'password' | 'appearance' | 'connectedAccounts' | 'dangerZone',
  waitForSelector: string
) {
  await expect(async () => {
    const tabs = page.locator(sel.navTabs);
    const select = page.locator(sel.navSelect);

    if (await tabs.isVisible().catch(() => false)) {
      await tabs.locator(`[data-section="${section}"]`).click();
    } else {
      const isOpen = await select.getAttribute('data-state').catch(() => null);

      if (isOpen === 'open') {
        await page.keyboard.press('Escape');
      }

      await select.click({ timeout: 3_000 });
      await page.locator(`[data-section="${section}"][role="option"]`).click({ timeout: 3_000 });
    }

    await expect(page.locator(waitForSelector)).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────────────
// Settings – Core Flow
// Profile update, section navigation, email validation, accent color
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Core Flow', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-core', testInfo.project.name);
    signIn = makeSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-core', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('profile update → section nav → email validation → accent color', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.common.settings));
    await expect(page).toHaveURL(/\/settings/);

    // ── Profile section visible by default ──
    await expect(page.locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(sel.bio)).toBeVisible();

    // ── Update profile ──
    await expect(async () => {
      const nameInput = page.locator(sel.fullName);
      await nameInput.click();
      await nameInput.fill('Test User');
      await expect(nameInput).toHaveValue('Test User');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.profileSubmit).click();
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });

    // ── Navigate to email → verify pre-filled → reject invalid ──
    await navigateToSection(page, 'email', sel.email);
    await expect(page.locator(sel.email)).toHaveValue(email);

    await page.locator(sel.email).clear();
    await page.locator(sel.email).fill('not-an-email');
    await page.locator(sel.emailSubmit).click();
    await expect(page).toHaveURL(/\/settings/);

    // ── Navigate to appearance → switch accent color → persists ──
    await navigateToSection(page, 'appearance', 'button[data-accent="blue"]');

    const html = page.locator('html');
    await page.locator('button[data-accent="teal"]').click();
    await expect(html).toHaveAttribute('data-accent', 'teal');

    await page.reload();
    await expect(html).toHaveAttribute('data-accent', 'teal', { timeout: 5_000 });

    // Reset to default
    await expect(page.locator('button[data-accent="blue"]')).toBeVisible({ timeout: 15_000 });
    await page.locator('button[data-accent="blue"]').click();
    await expect(html).toHaveAttribute('data-accent', 'blue');
  });

  test('hash navigation and browser back', async ({ page }) => {
    await signIn(page);

    // Direct hash navigation
    await page.goto(url(ROUTES.common.settings, SECTION_TO_HASH.email));
    await expect(page.locator(sel.email)).toBeVisible({ timeout: 15_000 });

    // Click nav updates hash
    await navigateToSection(page, 'password', sel.password);
    await expect(page).toHaveURL(/#password/);

    // Browser back returns to dashboard (hash changes use replaceState)
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // No hash defaults to profile
    await page.goto(url(ROUTES.common.settings));
    await expect(page.locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Password Update
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Password', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-password', testInfo.project.name);
    signIn = makeSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-password', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('rejects invalid → updates password → clears fields', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.common.settings, SECTION_TO_HASH.password));
    await expect(page.locator(sel.password)).toBeVisible({ timeout: 15_000 });

    // Weak password rejected
    await page.locator(sel.password).fill('weak');
    await page.locator(sel.confirmPassword).fill('weak');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings/);

    // Mismatched passwords rejected
    await page.locator(sel.password).fill('NewStrongPass1!');
    await page.locator(sel.confirmPassword).fill('DifferentPass1!');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings/);

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
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });

    // Fields cleared after success
    await expect(cpwField).toHaveValue('', { timeout: 5_000 });
    await expect(pw).toHaveValue('', { timeout: 5_000 });
    await expect(cpw).toHaveValue('', { timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Delete Account
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Delete Account', () => {
  test.describe.configure({ timeout: 60_000 });

  test('dialog → cancel → confirm → delete → dashboard locked', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-settings-delete', testInfo.project.name);
    const signIn = makeSignIn(email, PASSWORD);

    await ensureUser(email, PASSWORD);
    await signIn(page);

    await page.goto(url(ROUTES.common.settings, SECTION_TO_HASH.dangerZone));
    await expect(page.locator(sel.deleteButton)).toBeVisible({ timeout: 15_000 });

    // Open dialog
    await page.locator(sel.deleteButton).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Delete button disabled without confirmation
    await expect(dialog.locator('button[type="submit"]')).toBeDisabled();

    // Cancel closes dialog
    await dialog.locator('button[type="button"]').first().click();
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

    // Redirected away from settings
    await page.waitForURL((u) => !u.pathname.includes(ROUTES.common.settings), {
      timeout: 15_000,
    });

    // Dashboard no longer accessible
    await page.goto(url(ROUTES.common.dashboard));
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings – Complete Profile Modal
// ─────────────────────────────────────────────────────────────────
test.describe('Settings – Complete Profile Modal', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-modal', testInfo.project.name);
    signIn = makeSignIn(email, PASSWORD);
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
