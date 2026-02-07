import { expect, test } from '@playwright/test';

import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';

// Serialize describe blocks within each project to avoid overwhelming
// the dev server with too many concurrent sign-in flows.
// With fullyParallel + 5 browser projects, up to 25 tests can run at once.
// Serial mode ensures only 1 test per project runs at a time (max 5 concurrent).
test.describe.configure({ mode: 'serial' });

// ── Selectors ────────────────────────────────────────────────────
// Structural/semantic attributes for i18n resilience.

const sel = {
  // Navigation
  navTabs: '[data-testid="settings-nav"]',
  navSelect: '[data-testid="settings-nav-select"]',
  // Profile
  fullName: 'input[name="fullName"]',
  bio: 'textarea[name="bio"]',
  profileSubmit: 'form#profile-form button[type="submit"]',
  // Email
  email: 'input[name="email"]',
  emailSubmit: 'form#email-form button[type="submit"]',
  // Password
  currentPassword: 'input[name="currentPassword"]',
  password: 'input[name="password"]',
  confirmPassword: 'input[name="confirmPassword"]',
  passwordSubmit: 'form#password-form button[type="submit"]',
  // Delete account — scoped to destructive variant to avoid matching the nav select trigger
  deleteButton: 'button[data-variant="destructive"]:has(svg.lucide-trash-2)',
  confirmation: 'input[name="confirmation"]',
  // Shared
  toast: '[data-sonner-toast]',
  userMenu: 'button[aria-label="User menu"]',
} as const;

const PASSWORD = 'E2eSettingsPass1!';

// Scopes email to browser project to prevent race conditions
// across parallel Playwright projects (chromium, firefox, webkit, etc.)
function scopedEmail(base: string, projectName: string) {
  const slug = projectName.toLowerCase().replace(/\s+/g, '-');

  return `${base}+${slug}@example.com`;
}

// ── Shared helpers ───────────────────────────────────────────────
// Uses toPass() retry pattern for WebKit hydration resilience.

function makeSignIn(email: string) {
  return async function signIn(page: import('@playwright/test').Page) {
    await expect(async () => {
      await page.goto('/en/sign-in', { timeout: 15_000 });

      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      const submitBtn = page.locator('form button[type="submit"]');

      await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

      await emailInput.click();
      await emailInput.fill(email);
      await expect(emailInput).toHaveValue(email);

      await passwordInput.click();
      await passwordInput.fill(PASSWORD);
      await expect(passwordInput).toHaveValue(PASSWORD);

      await submitBtn.click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    }).toPass({ timeout: 50_000 });
  };
}

/**
 * Navigate to a settings section.
 * Desktop (lg+) uses vertical tabs, mobile uses a select dropdown.
 *
 * Waits for navigation UI to appear first (mounted guard delays render),
 * then clicks the appropriate trigger and verifies the section is visible.
 */
async function navigateToSection(
  page: import('@playwright/test').Page,
  section: 'profile' | 'email' | 'password' | 'connectedAccounts' | 'dangerZone',
  waitForSelector: string
) {
  // Use toPass() to handle the hydration race between desktop tabs
  // and mobile select — the mounted guard + useBreakpoint can flip
  // the layout after initial render, so we retry the whole sequence.
  await expect(async () => {
    const tabs = page.locator(sel.navTabs);
    const select = page.locator(sel.navSelect);

    if (await tabs.isVisible().catch(() => false)) {
      // Desktop: click the vertical tab trigger
      await tabs.locator(`[data-section="${section}"]`).click();
    } else {
      // Mobile: open select dropdown and pick the item
      await select.click({ timeout: 3_000 });
      await page.locator(`[data-section="${section}"]`).click({ timeout: 3_000 });
    }

    await expect(page.locator(waitForSelector)).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────────────
// Settings Page – Rendering & Profile
// ─────────────────────────────────────────────────────────────────
test.describe('Settings Page – Rendering & Profile', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-profile', testInfo.project.name);
    signIn = makeSignIn(email);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-profile', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('renders profile section → updates profile → navbar has back link', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/settings/);

    // ── Profile section visible by default ──
    await expect(page.locator(sel.fullName)).toBeVisible();
    await expect(page.locator(sel.bio)).toBeVisible();
    await expect(page.locator(sel.profileSubmit)).toBeVisible();

    // ── Bio max length ──
    await expect(page.locator(sel.bio)).toHaveAttribute('maxlength', '200');

    // ── Navigate to email section and verify ──
    await navigateToSection(page, 'email', sel.email);
    await expect(page.locator(sel.email)).toHaveValue(email);

    // ── Navigate back to profile and update ──
    await navigateToSection(page, 'profile', sel.fullName);

    const nameInput = page.locator(sel.fullName);

    await expect(async () => {
      await nameInput.click();
      await nameInput.fill('Test User');
      await expect(nameInput).toHaveValue('Test User');
    }).toPass({ timeout: 10_000 });

    await page.locator(sel.profileSubmit).click();
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 15_000 });

    // ── Back to dashboard link in navbar ──
    await expect(page.locator('nav a[href*="/dashboard"]').first()).toBeAttached();
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings Page – Email Validation
// ─────────────────────────────────────────────────────────────────
test.describe('Settings Page – Email Validation', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-email', testInfo.project.name);
    signIn = makeSignIn(email);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-email', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('stays on page with invalid email format', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/settings');
    await navigateToSection(page, 'email', sel.email);

    const emailInput = page.locator(sel.email);

    await emailInput.clear();
    await emailInput.fill('not-an-email');
    await page.locator(sel.emailSubmit).click();

    await expect(page).toHaveURL(/\/settings/);
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings Page – Password
// ─────────────────────────────────────────────────────────────────
test.describe('Settings Page – Password', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-password', testInfo.project.name);
    signIn = makeSignIn(email);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-password', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('validates passwords → updates password → clears fields', async ({ page }) => {
    await signIn(page);
    await page.goto('/en/settings');
    await navigateToSection(page, 'password', sel.password);

    // ── Weak password rejected ──
    await page.locator(sel.password).fill('weak');
    await page.locator(sel.confirmPassword).fill('weak');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings/);

    // ── Mismatched passwords rejected ──
    await page.locator(sel.password).fill('NewStrongPass1!');
    await page.locator(sel.confirmPassword).fill('DifferentPass1!');
    await page.locator(sel.passwordSubmit).click();
    await expect(page).toHaveURL(/\/settings/);

    // ── Valid password update succeeds ──
    const cpw_field = page.locator(sel.currentPassword);
    const pw = page.locator(sel.password);
    const cpw = page.locator(sel.confirmPassword);
    const newPassword = 'NewE2ePass1!';

    // Current password is required for email-based users
    await expect(async () => {
      await cpw_field.click();
      await cpw_field.fill(PASSWORD);
      await expect(cpw_field).toHaveValue(PASSWORD);
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
    await expect(cpw_field).toHaveValue('', { timeout: 5_000 });
    await expect(pw).toHaveValue('', { timeout: 5_000 });
    await expect(cpw).toHaveValue('', { timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings Page – Delete Account
// ─────────────────────────────────────────────────────────────────
test.describe('Settings Page – Delete Account', () => {
  test.describe.configure({ timeout: 60_000 });

  test('dialog interaction → cancel → confirm text → delete', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-settings-delete', testInfo.project.name);
    const signIn = makeSignIn(email);

    await ensureUser(email, PASSWORD);

    await signIn(page);
    await page.goto('/en/settings');
    await navigateToSection(page, 'dangerZone', sel.deleteButton);

    // ── Open dialog ──
    await page.locator(sel.deleteButton).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(sel.confirmation)).toBeVisible();

    const deleteSubmit = dialog.locator('button[type="submit"]');
    const input = dialog.locator(sel.confirmation);

    // ── Delete button disabled without confirmation ──
    await expect(deleteSubmit).toBeDisabled();

    // ── Wrong text — button stays disabled ──
    await input.fill('wrong text');
    await expect(deleteSubmit).toBeDisabled();

    // ── Cancel closes dialog ──
    const cancelButton = dialog.locator('button[type="button"]').first();
    await cancelButton.click();
    await expect(dialog).not.toBeVisible();

    // ── Reopen and delete ──
    await page.locator(sel.deleteButton).click();
    await expect(dialog).toBeVisible();

    const input2 = dialog.locator(sel.confirmation);
    const deleteSubmit2 = dialog.locator('button[type="submit"]');

    await expect(async () => {
      await input2.click();
      await input2.fill('delete my account');
      await expect(input2).toHaveValue('delete my account');
    }).toPass({ timeout: 10_000 });

    await expect(deleteSubmit2).toBeEnabled();
    await deleteSubmit2.click();

    // Should redirect away from settings
    await page.waitForURL((url) => !url.pathname.includes('/settings'), {
      timeout: 15_000,
    });

    // Dashboard should no longer be accessible
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Settings Page – Navigation via User Menu
// ─────────────────────────────────────────────────────────────────
test.describe('Settings Page – Navigation', () => {
  test.describe.configure({ timeout: 60_000 });

  let email: string;
  let signIn: ReturnType<typeof makeSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-settings-nav', testInfo.project.name);
    signIn = makeSignIn(email);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-settings-nav', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('navigates to settings and dashboard via user menu', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // ── Settings via user menu ──
    await page.locator(sel.userMenu).click();

    const settingsLink = page.locator('a[href*="/settings"]');
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();

    await expect(page).toHaveURL(/\/settings/);

    // ── Dashboard via user menu ──
    // On settings page the navbar also has a "Back to Dashboard" link,
    // so scope to the dropdown menu near the user avatar button.
    await page.locator(sel.userMenu).click();

    const menuDropdown = page.locator(sel.userMenu).locator('..');
    const dashboardLink = menuDropdown.locator('a[href*="/dashboard"]');
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
