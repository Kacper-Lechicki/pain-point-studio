/**
 * Survey Builder E2E Tests
 *
 * Covers the question builder interface:
 * - Loading the builder with pre-existing questions
 * - Adding, editing, switching, and deleting questions
 * - Saving draft and verifying persistence
 * - Editing survey metadata from the builder top bar
 * - Full publish flow (settings sheet → publish → success panel)
 *
 * Each describe block pre-creates a draft survey with questions via
 * DB helpers so we can jump straight into the builder. Serial mode
 * is used because tests within a block modify shared question state.
 *
 * Respondent-side flows are out of scope here.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createSurveyWithQuestions } from './helpers/survey-admin';

// Serial: tests mutate shared builder state within each describe block.
test.describe.configure({ mode: 'serial' });

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

  // Wait briefly for the button to appear naturally (desktop sidebar loading)
  try {
    await addBtn.waitFor({ state: 'visible', timeout: 3_000 });

    return;
  } catch {
    // Not visible yet — try the mobile "Questions" tab
  }

  // On mobile, the sidebar is a dialog opened via the "Questions" tab button
  const questionsTab = page.getByRole('button', { name: 'Questions' });
  await questionsTab.click();
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
}

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Question Editing
// Draft survey with 1 question. Tests add, edit, switch, delete,
// and save operations on questions.
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

  test('builder loads with existing question', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));

    // Question text input and step indicator visible
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();

    // Save Draft button present in the builder top bar
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();
  });

  test('edit question text enables save button', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // Use clear() + pressSequentially() instead of fill() because webkit's fill()
    // sometimes doesn't trigger React's synthetic onChange, leaving isDirty false.
    await expect(async () => {
      await page.locator(sel.questionInput).clear();
      await page.locator(sel.questionInput).pressSequentially('Pain point?', { delay: 30 });

      // Save Draft should be enabled now (dirty state)
      await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
    }).toPass({ timeout: 10_000 });
  });

  test('add second question via sidebar', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // On mobile, the sidebar is behind a "Questions" tab — open it first
    await ensureSidebarOpen(page);

    // Count all numbered step buttons (1, 2, 3…) before adding
    const allStepButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ });
    const countBefore = await allStepButtons.count();

    // Click "Add question" — aria-label is the accessible name
    await page.getByRole('button', { name: 'Add question' }).click();

    // Total step count should increase by 1
    await expect(allStepButtons).toHaveCount(countBefore + 1, { timeout: 5_000 });

    // The new question becomes active (has aria-current="step")
    await expect(page.locator('button[aria-current="step"]')).toBeVisible();

    // Close the sidebar dialog if open (mobile) so we can access the top bar.
    // The dialog renders with role="dialog" and a "Questions" heading.
    const sidebarDialog = page.getByRole('dialog', { name: 'Questions' });

    if (await sidebarDialog.isVisible().catch(() => false)) {
      await page.keyboard.press('Escape');
      await expect(sidebarDialog).not.toBeVisible({ timeout: 5_000 });
    }

    // Save so the new question persists across page reloads (subsequent tests)
    const saveBtn = page.getByRole('button', { name: 'Save Draft' });
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
    await expect(async () => {
      await saveBtn.click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });
  });

  test('switch between questions via step buttons', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // There should be 2 questions from previous test
    // Click step "1" and note the value
    const step1 = page.locator('button').filter({ hasText: /^1$/ });
    await step1.click();
    const firstQuestionValue = await page.locator(sel.questionInput).inputValue();

    // Click step "2" — the input should change
    const step2 = page.locator('button').filter({ hasText: /^2$/ });
    await step2.click();
    const secondQuestionValue = await page.locator(sel.questionInput).inputValue();

    // The two questions should have different text
    // (first has "E2E Test Question 1", second is empty or different)
    expect(firstQuestionValue).not.toBe(secondQuestionValue);

    // Switch back — should restore the first question text
    await step1.click();
    await expect(page.locator(sel.questionInput)).toHaveValue(firstQuestionValue);
  });

  test('delete question via sidebar actions', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // On mobile, open the sidebar to access question actions
    await ensureSidebarOpen(page);

    // Count step buttons before deletion
    const allStepButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ });
    const countBefore = await allStepButtons.count();

    // Open "Question actions" on the last sidebar item.
    // There are multiple "Question actions" buttons (one per question) —
    // we want the last one.
    const actionButtons = page.getByRole('button', { name: 'Question actions' });
    await actionButtons.last().click();

    // Click "Delete question" menu item
    await page.getByRole('menuitem', { name: 'Delete question' }).click();

    // Confirm in the alert dialog
    const dialog = page.locator(sel.alertDialog);
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: 'Delete question' }).click();

    // Step button count should decrease by 1
    await expect(allStepButtons).toHaveCount(countBefore - 1, { timeout: 5_000 });
  });

  test('save draft shows success toast', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    const saveBtn = page.getByRole('button', { name: 'Save Draft' });

    // Make a change to enable Save Draft, then click it.
    // Use clear() + pressSequentially() instead of fill() because webkit's fill()
    // sometimes doesn't trigger React's synthetic onChange, leaving isDirty false.
    await expect(async () => {
      await page.locator(sel.questionInput).clear();
      await page.locator(sel.questionInput).pressSequentially('Updated Q', { delay: 30 });
      await expect(saveBtn).toBeEnabled();
    }).toPass({ timeout: 15_000 });

    // Click Save Draft and verify success
    await expect(async () => {
      await saveBtn.click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });

    // After saving, the button should become disabled (clean state)
    await expect(saveBtn).toBeDisabled({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Metadata Editing
// Tests editing survey title/description from the builder top bar.
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

  test('edit metadata from builder opens panel and saves', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // Click the edit-metadata pencil button in the top bar
    await page.getByRole('button', { name: 'Edit survey details' }).click();

    // The metadata sheet should open with the title input
    await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 10_000 });

    // Change the title — use clear() + pressSequentially() instead of fill()
    // because webkit's fill() doesn't reliably fire React's onChange.
    await expect(async () => {
      await page.locator(sel.titleInput).clear();
      await page.locator(sel.titleInput).pressSequentially('Updated Title', { delay: 30 });
      await expect(page.locator(sel.titleInput)).toHaveValue('Updated Title');

      // Sheet footer save button should be enabled now (form dirty)
      const saveBtns = page.getByRole('button', { name: 'Save Draft' });
      await expect(saveBtns.last()).toBeEnabled();
    }).toPass({ timeout: 10_000 });

    // Save — the metadata panel uses a "Save Draft" button
    await expect(async () => {
      // There are two "Save Draft" buttons (top bar + panel) — click the one
      // inside the sheet (last visible one)
      const saveBtns = page.getByRole('button', { name: 'Save Draft' });
      await saveBtns.last().click();
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 20_000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Builder – Publish Flow
// Draft survey with 1 question (with text). Tests the full publish
// flow: open settings sheet → configure → publish → success panel.
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

  test('full publish flow: settings → publish → success', async ({ page }) => {
    await signIn(page);
    await page.goto(builderUrl(surveyId));
    await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

    // "Publish" button should be enabled (survey has at least 1 question with text)
    const publishBtn = page.getByRole('button', { name: 'Publish' });
    await expect(publishBtn).toBeEnabled({ timeout: 5_000 });

    // Click Publish — opens the publish settings sheet.
    // Wrap in toPass() because webkit can swallow clicks during hydration.
    // Re-clicking is safe: setPublishSettingsOpen(true) is idempotent.
    await expect(async () => {
      await publishBtn.click();
      await expect(page.getByText('Publish Settings')).toBeVisible();
    }).toPass({ timeout: 15_000 });

    // Leave end date and max respondents empty (both optional).
    // Click "Publish Survey" to execute.
    await expect(async () => {
      await page.getByRole('button', { name: 'Publish Survey' }).click();
      // Wait for success toast
      await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 30_000 });

    // Success panel should appear with "is live!" text
    await expect(page.getByText(/is live/)).toBeVisible({ timeout: 10_000 });

    // Navigation links in the success panel
    await expect(page.getByRole('link', { name: /Back to All Surveys/i })).toBeVisible();
  });
});
