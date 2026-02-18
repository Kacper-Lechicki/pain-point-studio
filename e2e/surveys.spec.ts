/**
 * Survey dashboard: creation flow, status lifecycle, and stats page.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createSurveyWithQuestions } from './helpers/survey-admin';

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  toast: '[data-sonner-toast]',
  titleInput: 'input[name="title"]',
  descriptionInput: 'textarea[name="description"]',
  alertDialog: '[role="alertdialog"]',
} as const;

const PASSWORD = 'E2eSurveyPass1!';

/**
 * Finds the survey row/card element containing the given title.
 * Works for both desktop (table row) and mobile (card in a list) layouts.
 */
function surveyItem(page: import('@playwright/test').Page, title: string) {
  return page.locator('tr, [role="list"] > *').filter({ hasText: title });
}

/**
 * Opens the "More actions" dropdown on a survey row, clicks a menu item,
 * and optionally confirms the alert dialog.
 *
 * Uses body-click dismiss before each attempt to handle Radix DropdownMenu
 * toggle behavior (Escape returns focus to trigger → next click closes menu).
 */
async function executeActionOnRow(
  page: import('@playwright/test').Page,
  title: string,
  menuItemName: string,
  confirmButtonName?: string
) {
  const row = surveyItem(page, title);
  await expect(row).toBeVisible({ timeout: 15_000 });

  await expect(async () => {
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await row.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menuitem', { name: menuItemName })).toBeVisible();
  }).toPass({ timeout: 10_000 });
  await page.getByRole('menuitem', { name: menuItemName }).click();

  if (confirmButtonName) {
    const dialog = page.locator(sel.alertDialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: confirmButtonName }).click();
  }
}

// ─────────────────────────────────────────────────────────────────
// Surveys – Creation Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Surveys – Creation Flow', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  const SURVEY_TITLE = `E2E Creation ${Date.now()}`;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-surveys-create', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    await ensureUser(email, PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-create', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Fresh user: empty state visible, create via metadata form, confirm in list
  test('empty state → create survey → verify in list', async ({ page }) => {
    await signIn(page);

    // ── Empty state ──
    await page.goto(url(ROUTES.dashboard.research));
    await expect(page.getByText('No surveys yet')).toBeVisible({ timeout: 15_000 });

    // ── Create survey metadata ──
    await page.goto(url(ROUTES.dashboard.researchNew));
    await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.locator(sel.titleInput).fill(SURVEY_TITLE);
      await expect(page.locator(sel.titleInput)).toHaveValue(SURVEY_TITLE);

      await page.locator(sel.descriptionInput).fill('E2E test survey description');
      await expect(page.locator(sel.descriptionInput)).toHaveValue('E2E test survey description');

      // Select category only if not already chosen (avoids re-opening
      // the dropdown on toPass() retries which blocks the "Next" button)
      const combobox = page.getByRole('combobox');
      const comboboxText = await combobox.textContent();

      if (!comboboxText || comboboxText.includes('Select')) {
        await combobox.click();
        await page.getByRole('option').first().click();
      }

      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/research\/new\/[0-9a-f-]+/);
    }).toPass({ timeout: 30_000 });

    // ── Verify survey appears in list ──
    await page.goto(url(ROUTES.dashboard.research));
    const row = surveyItem(page, SURVEY_TITLE);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Status Lifecycle
// Pre-created active survey. Tests the full state machine in one test:
// active → completed → archived → restored (draft) → deleted.
// ─────────────────────────────────────────────────────────────────
test.describe('Surveys – Status Lifecycle', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyTitle: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-surveys-lifecycle', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    const userId = await ensureUser(email, PASSWORD);

    surveyTitle = `E2E Lifecycle ${Date.now()}`;
    await createSurveyWithQuestions(userId, { title: surveyTitle, status: 'active' }, 2);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-lifecycle', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Pre-seeded active survey: walk through the full status state machine
  test('complete → archive → restore → delete', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.research));

    // ── Complete active survey ──
    await executeActionOnRow(page, surveyTitle, 'Complete survey', 'Complete survey');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // ── Archive completed survey ──
    // Dismiss toast first, then execute next action
    await page
      .locator(sel.toast)
      .first()
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});
    await executeActionOnRow(page, surveyTitle, 'Archive', 'Archive');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Survey disappears from main list
    await expect(surveyItem(page, surveyTitle)).not.toBeVisible({ timeout: 10_000 });

    // ── Verify on archive page ──
    await page.goto(url(ROUTES.dashboard.researchArchive));
    await expect(surveyItem(page, surveyTitle)).toBeVisible({ timeout: 15_000 });

    // ── Restore from archive ──
    await executeActionOnRow(page, surveyTitle, 'Restore', 'Restore');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Restored survey appears on main page
    await page.goto(url(ROUTES.dashboard.research));
    await expect(surveyItem(page, surveyTitle)).toBeVisible({ timeout: 15_000 });

    // ── Delete restored draft ──
    await executeActionOnRow(page, surveyTitle, 'Delete', 'Delete');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    await expect(surveyItem(page, surveyTitle)).not.toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Stats Page
// ─────────────────────────────────────────────────────────────────
test.describe('Surveys – Stats Page', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyId: string;
  let surveyTitle: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-surveys-stats', testInfo.project.name);
    signIn = makeApiSignIn(email, PASSWORD);
    const userId = await ensureUser(email, PASSWORD);

    surveyTitle = `E2E Stats ${Date.now()}`;
    const result = await createSurveyWithQuestions(
      userId,
      { title: surveyTitle, status: 'active' },
      3
    );
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-stats', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Pre-seeded active survey with 3 questions → verify stats page layout
  test('stats page loads with overview structure', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.researchStats}/${surveyId}`));

    await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Metrics')).toBeVisible();
    await expect(page.getByText('Views')).toBeVisible();
    await expect(page.getByText('Participants')).toBeVisible();
    await expect(page.getByText('Responses', { exact: true })).toBeVisible();
  });
});
