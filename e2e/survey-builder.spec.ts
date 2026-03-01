/**
 * Survey builder: question CRUD, metadata editing, and publish flow.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel as sharedSel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createProjectViaDb, createSurveyWithQuestions } from './helpers/survey-admin';

const sel = {
  ...sharedSel,
  questionInput: 'input[placeholder="Type your question here..."]',
  titleInput: 'input[name="title"]',
} as const;

/** Builds the builder URL for a given survey ID. */
function builderUrl(surveyId: string) {
  return url(`${ROUTES.dashboard.researchNew}/${surveyId}`);
}

/**
 * On mobile viewports, the question sidebar is behind a "Questions" tab.
 * On desktop, the sidebar is always visible but may take time to load.
 */
async function ensureSidebarOpen(page: import('@playwright/test').Page) {
  const addBtn = page.getByRole('button', { name: 'Add question' });

  try {
    await addBtn.waitFor({ state: 'visible', timeout: 3_000 });

    return;
  } catch {
    // Not visible yet — try the mobile "Questions" tab
  }

  const questionsTab = page.getByRole('button', { name: 'Questions' });

  await questionsTab.click();
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
}

/**
 * Closes the mobile sidebar dialog if it's open. On desktop this is a no-op.
 */
async function ensureSidebarClosed(page: import('@playwright/test').Page) {
  const sidebarDialog = page.getByRole('dialog', { name: 'Questions' });

  await page.waitForTimeout(300);

  if (await sidebarDialog.isVisible().catch(() => false)) {
    const viewport = page.viewportSize();
    const x = viewport ? viewport.width - 20 : 350;
    const y = viewport ? Math.round(viewport.height / 2) : 400;

    await page.mouse.click(x, y);
    await expect(sidebarDialog).not.toBeVisible({ timeout: 5_000 });
  }
}

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Question Editing
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Builder – Question Editing', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-builder-editing', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);

    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Builder Editing');

    const result = await createSurveyWithQuestions(userId, { projectId }, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-editing', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('load, edit, add, switch, delete, and save', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));

    // Load: builder shows existing question
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();

    // Edit: change question text
    await expect(async () => {
      await page.locator(sel.questionInput).clear();
      await page.locator(sel.questionInput).pressSequentially('Pain point?', { delay: 30 });
      await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
    }).toPass({ timeout: 10_000 });

    // Add: second question via sidebar
    await ensureSidebarOpen(page);

    const allStepButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ });
    const countBefore = await allStepButtons.count();

    await page.getByRole('button', { name: 'Add question' }).click();
    await expect(allStepButtons).toHaveCount(countBefore + 1, { timeout: 5_000 });
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();
    await ensureSidebarClosed(page);

    // Switch: navigate between questions via step buttons
    const step1 = page.locator('button').filter({ hasText: /^1$/ });
    const step2 = page.locator('button').filter({ hasText: /^2$/ });

    await step1.click();

    const firstValue = await page.locator(sel.questionInput).inputValue();

    await step2.click();

    const secondValue = await page.locator(sel.questionInput).inputValue();
    expect(firstValue).not.toBe(secondValue);

    await step1.click();
    await expect(page.locator(sel.questionInput)).toHaveValue(firstValue);

    // Delete: remove the second question
    await ensureSidebarOpen(page);

    const countBeforeDelete = await allStepButtons.count();
    const actionButtons = page.getByRole('button', { name: 'Question actions' });

    await actionButtons.last().click();
    await page.getByRole('menuitem', { name: 'Delete question' }).click();

    const dialog = page.locator(sel.alertDialog);

    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: 'Delete question' }).click();
    await expect(allStepButtons).toHaveCount(countBeforeDelete - 1, { timeout: 5_000 });
    await ensureSidebarClosed(page);

    // Save: save draft and verify toast
    const saveBtn = page.getByRole('button', { name: 'Save Draft' });

    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });

    await expect(async () => {
      await saveBtn.click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });

    await expect(saveBtn).toBeDisabled({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Metadata Editing
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Builder – Metadata Editing', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-builder-metadata', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Builder Metadata');

    const result = await createSurveyWithQuestions(userId, { projectId }, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-metadata', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('edit metadata from builder opens panel and saves', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.getByRole('button', { name: 'Edit survey details' }).click();
      await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 15_000 });

    await expect(async () => {
      await page.locator(sel.titleInput).clear();

      await page.locator(sel.titleInput).pressSequentially('Updated Title', { delay: 30 });

      await expect(page.locator(sel.titleInput)).toHaveValue('Updated Title');

      const saveBtns = page.getByRole('button', { name: 'Save Draft' });

      await expect(saveBtns.last()).toBeEnabled();
    }).toPass({ timeout: 10_000 });

    await expect(async () => {
      const saveBtns = page.getByRole('button', { name: 'Save Draft' });

      await saveBtns.last().click();
      await expect(page.locator(sel.titleInput)).toBeHidden({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Publish Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Builder – Publish Flow', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let surveyId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-builder-publish', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Builder Publish');

    const result = await createSurveyWithQuestions(userId, { projectId }, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-publish', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('full publish flow: settings → publish → success', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    const publishBtn = page.getByRole('button', { name: 'Publish' });

    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });

    await expect(async () => {
      await publishBtn.click();
      await expect(page.getByText('Publish Settings')).toBeVisible();
    }).toPass({ timeout: 15_000 });

    await expect(async () => {
      await page.getByRole('button', { name: 'Publish Survey' }).click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    await expect(page.getByText(/is live/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Back to All Surveys/i })).toBeVisible();
  });
});
