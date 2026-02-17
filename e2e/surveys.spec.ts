/**
 * Survey Dashboard E2E Tests
 *
 * Covers all key owner operations visible from the survey dashboard:
 * - Empty state & survey creation flow
 * - Survey list & detail panel
 * - Full status lifecycle (active → completed → archived → restored → deleted)
 * - Stats page structure
 *
 * Tests use DB helpers (survey-admin.ts) to seed surveys directly,
 * avoiding slow UI-based setup. Each describe block is serial because
 * tests share the survey created in beforeAll and mutate its state.
 *
 * Respondent-side flows are out of scope here.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createSurveyWithQuestions } from './helpers/survey-admin';

// Serial: 1 test per browser project at a time (max 5 concurrent).
test.describe.configure({ mode: 'serial' });

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
 * Works for both desktop (table row with `aria-label`) and
 * mobile (card in a list) layouts.
 */
function surveyItem(page: import('@playwright/test').Page, title: string) {
  // Desktop: <tr aria-label="title" role="button">
  // Mobile: card <div> inside a list
  // Use `tr, [role="list"] > *` to match both layouts
  return page.locator('tr, [role="list"] > *').filter({ hasText: title });
}

// ─────────────────────────────────────────────────────────────────
// Surveys – Empty State & Creation
// Fresh user with zero surveys. Tests creation flow end-to-end.
// ─────────────────────────────────────────────────────────────────
test.describe('Surveys – Empty State & Creation', () => {
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

  test('empty state visible when no surveys exist', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    // Empty state shows instructional text and a CTA
    await expect(page.getByText('No surveys yet')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /create survey|new survey/i })).toBeVisible();
  });

  test('create survey metadata and navigate to builder', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveysNew));
    await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 15_000 });

    // Fill all fields and submit in a single toPass() to guard against
    // WebKit hydration resets clearing earlier fields before submission.
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

      // Dismiss any lingering dropdown / popover before clicking Next
      await page.keyboard.press('Escape');

      // Submit — "Next" navigates to the builder page
      // exact: true avoids matching the Next.js Dev Tools button in dev mode
      await page.getByRole('button', { name: 'Next', exact: true }).click();

      // Builder URL pattern: /en/dashboard/surveys/new/<uuid>
      await expect(page).toHaveURL(/\/dashboard\/surveys\/new\/[0-9a-f-]+/);
    }).toPass({ timeout: 30_000 });
  });

  test('created survey appears in list with correct title', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    // The survey table should contain a row with our title
    const row = surveyItem(page, SURVEY_TITLE);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  test('clicking row opens detail panel with survey info', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    const row = surveyItem(page, SURVEY_TITLE);
    await expect(row).toBeVisible({ timeout: 20_000 });

    // Open the detail panel via the "More actions" menu → "Quick preview".
    // Using the action menu is more reliable than clicking the table row directly
    // because webkit intermittently blocks clicks on <tr role="button"> when the
    // row's onClick guard detects a stale dialog overlay during hydration.
    //
    // Retry pattern: each attempt dismisses any prior menu by clicking the page
    // body (outside-click).  Unlike Escape, this moves focus AWAY from the trigger
    // so the next .click() is always a fresh "open" (not a toggle-close).
    await expect(async () => {
      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await row.getByRole('button', { name: 'More actions' }).click();
      await expect(page.getByRole('menuitem', { name: /preview|details/i })).toBeVisible();
    }).toPass({ timeout: 10_000 });
    await page.getByRole('menuitem', { name: /preview|details/i }).click();

    // Detail panel renders the survey title in a heading
    await expect(page.getByRole('heading', { name: SURVEY_TITLE })).toBeVisible({
      timeout: 15_000,
    });

    // Draft survey shows the "Edit" action
    await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Status Lifecycle
// Pre-created active survey. Tests the full state machine:
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

  /**
   * Opens the "More actions" dropdown on the survey row matching `surveyTitle`,
   * clicks a menu item, and confirms the alert dialog.
   */
  async function executeActionOnRow(
    page: import('@playwright/test').Page,
    menuItemName: string,
    confirmButtonName?: string
  ) {
    const row = surveyItem(page, surveyTitle);
    await expect(row).toBeVisible({ timeout: 15_000 });

    // Dismiss any open menu by clicking body (moves focus away from trigger).
    // Unlike Escape, clicking body does NOT return focus to the trigger, so
    // the next .click() is always a fresh "open" (not a toggle-close).
    await expect(async () => {
      await page.locator('body').click({ position: { x: 0, y: 0 } });
      await row.getByRole('button', { name: 'More actions' }).click();
      await expect(page.getByRole('menuitem', { name: menuItemName })).toBeVisible();
    }).toPass({ timeout: 10_000 });
    await page.getByRole('menuitem', { name: menuItemName }).click();

    // If the action requires confirmation, click the confirm button in the dialog
    if (confirmButtonName) {
      const dialog = page.locator(sel.alertDialog);
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      await dialog.getByRole('button', { name: confirmButtonName }).click();
    }
  }

  test('complete active survey via action menu', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    await executeActionOnRow(page, 'Complete survey', 'Complete survey');

    // Success toast confirms server-side status change
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
  });

  test('archive completed survey', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    await executeActionOnRow(page, 'Archive', 'Archive');

    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Archived surveys disappear from the main list
    const row = surveyItem(page, surveyTitle);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });

  test('archived survey visible on archive page', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveysArchive));

    const row = surveyItem(page, surveyTitle);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  test('restore archived survey to draft', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveysArchive));

    await executeActionOnRow(page, 'Restore', 'Restore');

    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Restored survey now appears on the main surveys page as a draft
    await page.goto(url(ROUTES.dashboard.surveys));
    const row = surveyItem(page, surveyTitle);
    await expect(row).toBeVisible({ timeout: 15_000 });
  });

  test('delete restored draft', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.surveys));

    await executeActionOnRow(page, 'Delete', 'Delete');

    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Deleted survey is gone
    const row = surveyItem(page, surveyTitle);
    await expect(row).not.toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Stats Page
// Pre-created active survey. Verifies the stats page loads with
// the expected overview structure (metrics, question breakdown).
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

  test('stats page loads with overview structure', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.surveysStats}/${surveyId}`));

    // Survey title in heading and metrics section
    await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Metrics')).toBeVisible();

    // Key metric labels visible
    await expect(page.getByText('Visitors')).toBeVisible();
    await expect(page.getByText('Responses', { exact: true })).toBeVisible();
  });
});
