import { expect, test } from '../fixtures';
import { waitForToast } from '../helpers/actions';
import { ROUTES, url } from '../helpers/routes';
import { sel } from '../helpers/selectors';

function builderUrl(surveyId: string) {
  return url(`${ROUTES.dashboard.researchNew}/${surveyId}`);
}

async function ensureSidebarOpen(page: import('@playwright/test').Page) {
  const addBtn = page.getByRole('button', { name: 'Add question' });

  try {
    await addBtn.waitFor({ state: 'visible', timeout: 3_000 });

    return;
  } catch {}

  await page.getByRole('button', { name: 'Questions' }).click();
  await expect(addBtn).toBeVisible({ timeout: 5_000 });
}

async function ensureSidebarClosed(page: import('@playwright/test').Page) {
  const sidebarDialog = page.getByRole('dialog', { name: 'Questions' });

  try {
    await sidebarDialog.waitFor({ state: 'visible', timeout: 1_000 });
  } catch {
    return;
  }

  const viewport = page.viewportSize();
  const x = viewport ? viewport.width - 20 : 350;
  const y = viewport ? Math.round(viewport.height / 2) : 400;

  await page.mouse.click(x, y);
  await expect(sidebarDialog).not.toBeVisible({ timeout: 5_000 });
}

test('builder: load, edit, add, switch, delete, and save', async ({
  page,
  testSurvey: { surveyId },
}) => {
  await page.goto(builderUrl(surveyId), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('button[aria-current="step"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();
  await page.locator(sel.questionInput).clear();
  await page.locator(sel.questionInput).pressSequentially('Pain point?', { delay: 30 });
  await expect(page.getByRole('button', { name: 'Save Draft' })).toBeEnabled({ timeout: 10_000 });
  await ensureSidebarOpen(page);

  const allStepButtons = page.locator('button').filter({ hasText: /^[0-9]+$/ });
  const countBefore = await allStepButtons.count();

  await page.getByRole('button', { name: 'Add question' }).click();
  await expect(allStepButtons).toHaveCount(countBefore + 1, { timeout: 5_000 });
  await ensureSidebarClosed(page);

  const step1 = page.locator('button').filter({ hasText: /^1$/ });
  const step2 = page.locator('button').filter({ hasText: /^2$/ });

  await step1.click();

  const firstValue = await page.locator(sel.questionInput).inputValue();

  await step2.click();

  const secondValue = await page.locator(sel.questionInput).inputValue();

  expect(firstValue).not.toBe(secondValue);

  await step1.click();
  await expect(page.locator(sel.questionInput)).toHaveValue(firstValue);
  await ensureSidebarOpen(page);

  const countBeforeDelete = await allStepButtons.count();

  await page.getByRole('button', { name: 'Question actions' }).last().click();
  await page.getByRole('menuitem', { name: 'Delete question' }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: 'Delete question' }).click();
  await expect(allStepButtons).toHaveCount(countBeforeDelete - 1, { timeout: 5_000 });
  await ensureSidebarClosed(page);

  const saveBtn = page.getByRole('button', { name: 'Save Draft' });

  await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
  await saveBtn.click();
  await waitForToast(page);
  await expect(saveBtn).toBeDisabled({ timeout: 5_000 });
});

test('builder: edit metadata panel and save', async ({ page, testSurvey: { surveyId } }) => {
  await page.goto(builderUrl(surveyId), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Edit survey details' }).click();
  await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 5_000 });
  await page.locator(sel.titleInput).clear();
  await page.locator(sel.titleInput).pressSequentially('Updated Title', { delay: 30 });
  await expect(page.locator(sel.titleInput)).toHaveValue('Updated Title');

  const saveBtns = page.getByRole('button', { name: 'Save Draft' });

  await expect(saveBtns.last()).toBeEnabled({ timeout: 10_000 });
  await saveBtns.last().click();
  await expect(page.locator(sel.titleInput)).toBeHidden({ timeout: 10_000 });
});

test('builder: publish disabled when no valid questions', async ({
  page,
  testSurvey: { surveyId },
}) => {
  await page.goto(builderUrl(surveyId), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

  await ensureSidebarOpen(page);

  await page.getByRole('button', { name: 'Question actions' }).last().click();
  await page.getByRole('menuitem', { name: 'Delete question' }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: 'Delete question' }).click();
  await ensureSidebarClosed(page);

  const publishBtn = page.getByRole('button', { name: 'Publish' });

  await expect(publishBtn).toBeDisabled({ timeout: 5_000 });
});

test('builder: save draft re-enables on further edits', async ({
  page,
  testSurvey: { surveyId },
}) => {
  await page.goto(builderUrl(surveyId), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

  await page.locator(sel.questionInput).clear();
  await page.locator(sel.questionInput).pressSequentially('First edit', { delay: 30 });

  const saveBtn = page.getByRole('button', { name: 'Save Draft' });

  await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
  await saveBtn.click();
  await waitForToast(page);
  await expect(saveBtn).toBeDisabled({ timeout: 5_000 });

  await page.locator(sel.questionInput).clear();
  await page.locator(sel.questionInput).pressSequentially('Second edit', { delay: 30 });
  await expect(saveBtn).toBeEnabled({ timeout: 10_000 });
});

test('builder: full publish flow', async ({ page, testSurvey: { surveyId } }) => {
  await page.goto(builderUrl(surveyId), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.questionInput)).toBeVisible({ timeout: 15_000 });

  const publishBtn = page.getByRole('button', { name: 'Publish' });

  await expect(publishBtn).toBeEnabled({ timeout: 5_000 });
  await publishBtn.click();
  await expect(page.getByText('Publish Settings')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Publish Survey' }).click();
  await waitForToast(page);
  await expect(page.getByText(/is live/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('link', { name: /Back to All Surveys/i })).toBeVisible();
});
