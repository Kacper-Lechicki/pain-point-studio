/**
 * Survey dashboard: creation flow, status lifecycle, duplicate, and stats page.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel as sharedSel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createSurveyWithQuestions } from './helpers/survey-admin';

const sel = {
  ...sharedSel,
  titleInput: 'input[name="title"]',
  descriptionInput: 'textarea[name="description"]',
} as const;

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
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-create', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('empty state → create survey → verify in list', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.research));
    await expect(page.getByRole('heading', { name: 'Surveys', level: 1, exact: true })).toBeVisible(
      {
        timeout: 15_000,
      }
    );
    await expect(page.getByText('No surveys yet')).toBeVisible({ timeout: 15_000 });
    await page.goto(url(ROUTES.dashboard.researchNew));
    await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.locator(sel.titleInput).fill(SURVEY_TITLE);
      await expect(page.locator(sel.titleInput)).toHaveValue(SURVEY_TITLE);
      await page.locator(sel.descriptionInput).fill('E2E test survey description');

      await expect(page.locator(sel.descriptionInput)).toHaveValue('E2E test survey description');

      const combobox = page.getByRole('combobox', { name: 'Category' });
      const comboboxText = await combobox.textContent();

      if (!comboboxText || comboboxText.includes('Select')) {
        await combobox.click();
        await page.getByRole('option').first().click();
      }

      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard\/research\/new\/[0-9a-f-]+/);
    }).toPass({ timeout: 30_000 });

    await page.goto(url(ROUTES.dashboard.research));

    const row = surveyItem(page, SURVEY_TITLE);

    await expect(row).toBeVisible({ timeout: 15_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Status Lifecycle
// ─────────────────────────────────────────────────────────────────
test.describe('Surveys – Status Lifecycle', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyTitle: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-surveys-lifecycle', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);

    const userId = await ensureUser(email, E2E_PASSWORD);

    surveyTitle = `E2E Lifecycle ${Date.now()}`;

    await createSurveyWithQuestions(userId, { title: surveyTitle, status: 'active' }, 2);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-lifecycle', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('complete → archive → restore → delete', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.research));
    await executeActionOnRow(page, surveyTitle, 'Complete survey', 'Complete survey');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    await page
      .locator(sel.toast)
      .first()
      .waitFor({ state: 'hidden', timeout: 10_000 })
      .catch(() => {});

    await executeActionOnRow(page, surveyTitle, 'Archive', 'Archive');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    await expect(surveyItem(page, surveyTitle)).not.toBeVisible({ timeout: 10_000 });
    await page.goto(url(ROUTES.dashboard.researchArchive));
    await expect(surveyItem(page, surveyTitle)).toBeVisible({ timeout: 15_000 });
    await executeActionOnRow(page, surveyTitle, 'Restore', 'Restore');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    await page.goto(url(ROUTES.dashboard.research));
    await expect(surveyItem(page, surveyTitle)).toBeVisible({ timeout: 15_000 });
    await executeActionOnRow(page, surveyTitle, 'Delete', 'Delete');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    await expect(surveyItem(page, surveyTitle)).not.toBeVisible({ timeout: 10_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Surveys – Duplicate (skipped: UI not wired up yet)
// ─────────────────────────────────────────────────────────────────
test.describe.skip('Surveys – Duplicate', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyTitle: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-surveys-duplicate', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);

    surveyTitle = `E2E Duplicate ${Date.now()}`;
    await createSurveyWithQuestions(userId, { title: surveyTitle }, 2);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-surveys-duplicate', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('duplicates survey and shows copy in list', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.research));
    await executeActionOnRow(page, surveyTitle, 'Duplicate');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    const copy = surveyItem(page, `${surveyTitle} (copy)`);

    await expect(copy).toBeVisible({ timeout: 15_000 });
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

    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);

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
    await page.goto(url(`${ROUTES.dashboard.researchStats}/${surveyId}`));

    await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByText('Metrics')).toBeVisible();
    await expect(page.getByText('Views')).toBeVisible();
    await expect(page.getByText('Participants')).toBeVisible();
    await expect(page.getByText('Responses', { exact: true })).toBeVisible();
  });
});
