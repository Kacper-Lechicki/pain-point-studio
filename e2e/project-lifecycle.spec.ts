/**
 * Project status transitions via the project detail page actions dropdown.
 * Covers: complete → reopen, archive → restore, trash → restore from trash.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createProjectViaDb } from './helpers/survey-admin';

/**
 * Opens the "More actions" dropdown on the project detail header, clicks a menu item,
 * and confirms the alert dialog.
 */
async function executeDetailAction(
  page: import('@playwright/test').Page,
  menuItemName: string,
  confirmButtonName: string
) {
  await expect(async () => {
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menuitem', { name: menuItemName })).toBeVisible();
  }).toPass({ timeout: 10_000 });

  await page.getByRole('menuitem', { name: menuItemName }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: confirmButtonName }).click();
}

/** Waits for toast to appear and then hides. */
async function waitForToastCycle(page: import('@playwright/test').Page) {
  await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
  await page
    .locator(sel.toast)
    .first()
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {});
}

/**
 * Clicks a banner action button (e.g. Reopen, Restore) and confirms the dialog.
 * Banner buttons trigger the same ConfirmDialog as dropdown actions.
 */
async function executeBannerAction(
  page: import('@playwright/test').Page,
  buttonName: string,
  confirmButtonName: string
) {
  await page.getByRole('button', { name: buttonName, exact: true }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: confirmButtonName }).click();
}

// ─────────────────────────────────────────────────────────────────
// Project Lifecycle – Complete & Reopen
// ─────────────────────────────────────────────────────────────────
test.describe('Project Lifecycle – Complete & Reopen', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let projectId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-proj-lifecycle-cr', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    projectId = await createProjectViaDb(userId, 'E2E Lifecycle CR');
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-proj-lifecycle-cr', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('active → complete → reopen', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

    await expect(page.getByRole('heading', { name: 'E2E Lifecycle CR' })).toBeVisible({
      timeout: 15_000,
    });

    // Complete (active → completed) via dropdown
    await executeDetailAction(page, 'Complete', 'Complete');
    await waitForToastCycle(page);

    // Completed banner should appear with "Reopen" button
    // Reopen (completed → active) via banner button
    await executeBannerAction(page, 'Reopen', 'Reopen');
    await waitForToastCycle(page);
  });
});

// ─────────────────────────────────────────────────────────────────
// Project Lifecycle – Archive & Restore
// ─────────────────────────────────────────────────────────────────
test.describe('Project Lifecycle – Archive & Restore', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let projectId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-proj-lifecycle-ar', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    projectId = await createProjectViaDb(userId, 'E2E Lifecycle AR');
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-proj-lifecycle-ar', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('active → archive → restore', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

    await expect(page.getByRole('heading', { name: 'E2E Lifecycle AR' })).toBeVisible({
      timeout: 15_000,
    });

    // Archive (active → archived) via dropdown
    await executeDetailAction(page, 'Archive', 'Archive');
    await waitForToastCycle(page);

    // Archived banner should appear with "Restore" button
    // Restore (archived → active) via banner button
    await executeBannerAction(page, 'Restore', 'Restore');
    await waitForToastCycle(page);
  });
});

// ─────────────────────────────────────────────────────────────────
// Project Lifecycle – Trash & Restore
// ─────────────────────────────────────────────────────────────────
test.describe('Project Lifecycle – Trash & Restore', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let projectId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-proj-lifecycle-tr', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    projectId = await createProjectViaDb(userId, 'E2E Lifecycle TR');
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-proj-lifecycle-tr', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('active → trash → restore from trash', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

    await expect(page.getByRole('heading', { name: 'E2E Lifecycle TR' })).toBeVisible({
      timeout: 15_000,
    });

    // Trash (active → trashed) via dropdown
    await executeDetailAction(page, 'Move to Trash', 'Move to Trash');
    await waitForToastCycle(page);

    // Trashed banner should appear with "Restore" button
    // Restore (trashed → active) via banner button
    // The banner button label comes from 'projects.list.actions.restoreTrash' = "Restore"
    await executeBannerAction(page, 'Restore', 'Restore');
    await waitForToastCycle(page);
  });
});
