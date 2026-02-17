/**
 * Survey builder: question CRUD, metadata editing, and publish flow.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createSurveyWithQuestions } from './helpers/survey-admin';

// ── Selectors ────────────────────────────────────────────────────
const sel = {
  toast: '[data-sonner-toast]',
  questionInput: 'input[placeholder="Type your question here..."]',
  alertDialog: '[role="alertdialog"]',
  titleInput: 'input[name="title"]',
} as const;

const PASSWORD = 'E2eBuilderPass1!';

/** Builds the builder URL for a given survey ID. */
function builderUrl(surveyId: string) {
  return url(`${ROUTES.dashboard.surveysNew}/${surveyId}`);
}

/**
 * On mobile viewports, the question sidebar is behind a "Questions" tab.
 * On desktop, the sidebar is always visible but may take time to load.
 * This helper ensures the "Add question" button is accessible.
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
 * The sidebar Sheet opens from the left (w-72 = 288px), so clicking on the
 * right half of the viewport hits the overlay and dismisses it reliably.
 * Falls back to Escape if the overlay click doesn't work.
 */
async function ensureSidebarClosed(page: import('@playwright/test').Page) {
  const sidebarDialog = page.getByRole('dialog', { name: 'Questions' });

  // Short wait for dialog state to settle after preceding actions (e.g. delete confirmation)
  await page.waitForTimeout(300);

  if (await sidebarDialog.isVisible().catch(() => false)) {
    // The Sheet overlay is to the right of the 288px panel.
    // Click the viewport center-right to hit the overlay.
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
    signIn = makeApiSignIn(email, PASSWORD);
    const userId = await ensureUser(email, PASSWORD);

    const result = await createSurveyWithQuestions(userId, {}, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-editing', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Pre-seeded 1-question survey → full CRUD cycle on questions
  test('load, edit, add, switch, delete, and save', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));

    // ── Load: builder shows existing question ──
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();

    // ── Edit: change question text → Save Draft enabled ──
    // Use clear() + pressSequentially() because webkit's fill() sometimes
    // doesn't trigger React's synthetic onChange, leaving isDirty false.
    await expect(async () => {
      await page.locator(sel.questionInput).clear();
      await page.locator(sel.questionInput).pressSequentially('Pain point?', { delay: 30 });
      await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
    }).toPass({ timeout: 10_000 });

    // ── Add: second question via sidebar ──
    await ensureSidebarOpen(page);
    const allStepButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ });
    const countBefore = await allStepButtons.count();

    await page.getByRole('button', { name: 'Add question' }).click();
    await expect(allStepButtons).toHaveCount(countBefore + 1, { timeout: 5_000 });
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();

    // Close sidebar dialog if open (mobile) before interacting with canvas
    await ensureSidebarClosed(page);

    // ── Switch: navigate between questions via step buttons ──
    const step1 = page.locator('button').filter({ hasText: /^1$/ });
    const step2 = page.locator('button').filter({ hasText: /^2$/ });

    await step1.click();
    const firstValue = await page.locator(sel.questionInput).inputValue();

    await step2.click();
    const secondValue = await page.locator(sel.questionInput).inputValue();
    expect(firstValue).not.toBe(secondValue);

    await step1.click();
    await expect(page.locator(sel.questionInput)).toHaveValue(firstValue);

    // ── Delete: remove the second question ──
    await ensureSidebarOpen(page);
    const countBeforeDelete = await allStepButtons.count();

    const actionButtons = page.getByRole('button', { name: 'Question actions' });
    await actionButtons.last().click();
    await page.getByRole('menuitem', { name: 'Delete question' }).click();

    const dialog = page.locator(sel.alertDialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: 'Delete question' }).click();
    await expect(allStepButtons).toHaveCount(countBeforeDelete - 1, { timeout: 5_000 });

    // Close sidebar dialog if open (mobile) before accessing Save Draft
    await ensureSidebarClosed(page);

    // ── Save: save draft and verify toast ──
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
    signIn = makeApiSignIn(email, PASSWORD);
    const userId = await ensureUser(email, PASSWORD);

    const result = await createSurveyWithQuestions(userId, {}, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-metadata', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Pencil icon → metadata panel → change title → save draft
  test('edit metadata from builder opens panel and saves', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Edit survey details' }).click();
    await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 10_000 });

    // Change the title — use clear() + pressSequentially() for webkit compatibility
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
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
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
    signIn = makeApiSignIn(email, PASSWORD);
    const userId = await ensureUser(email, PASSWORD);

    const result = await createSurveyWithQuestions(userId, {}, 1);
    surveyId = result.surveyId;
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-builder-publish', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  // Publish button → settings sheet → confirm → success panel
  test('full publish flow: settings → publish → success', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    const publishBtn = page.getByRole('button', { name: 'Publish' });
    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });

    // Click Publish — opens the publish settings sheet.
    // Wrap in toPass() because webkit can swallow clicks during hydration.
    // Re-clicking is safe: setPublishSettingsOpen(true) is idempotent.
    await expect(async () => {
      await publishBtn.click();
      await expect(page.getByText('Publish Settings')).toBeVisible();
    }).toPass({ timeout: 15_000 });

    // Click "Publish Survey" to execute
    await expect(async () => {
      await page.getByRole('button', { name: 'Publish Survey' }).click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    // Success panel
    await expect(page.getByText(/is live/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /Back to All Surveys/i })).toBeVisible();
  });
});
