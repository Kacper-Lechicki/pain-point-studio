import { expect, test } from '../fixtures';
import {
  executeDetailAction,
  executeMenuAction,
  fillField,
  listItem,
  waitForToast,
  waitForToastCycle,
} from '../helpers/actions';
import { createSurveyWithQuestions, updateSurveyViaDb } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';
import { sel } from '../helpers/selectors';

function projectSurveysUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}?tab=surveys`);
}

test('create survey: empty state -> wizard -> verify in list', async ({
  page,
  testProject: { projectId },
}) => {
  await page.goto(projectSurveysUrl(projectId));
  await expect(page.getByRole('tab', { name: 'Research' })).toBeVisible({ timeout: 15_000 });

  const SURVEY_TITLE = `E2E Creation ${Date.now()}`;

  await page
    .getByRole('button', { name: /create.*survey|new.*survey/i })
    .first()
    .click();

  await expect(page.locator(sel.titleInput)).toBeVisible({ timeout: 15_000 });
  await fillField(page.locator(sel.titleInput), SURVEY_TITLE);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator(sel.descriptionInput)).toBeVisible({ timeout: 10_000 });
  await fillField(page.locator(sel.descriptionInput), 'E2E test survey description');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Create Survey' })).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole('button', { name: 'Create Survey' }).click();
  await expect(page).toHaveURL(/\/dashboard\/research\/new\/[0-9a-f-]+/, { timeout: 30_000 });
  await expect(async () => {
    await page.goto(projectSurveysUrl(projectId), { waitUntil: 'networkidle' });
    await expect(listItem(page, SURVEY_TITLE)).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 25_000 });
});

test('survey lifecycle: complete -> trash -> restore', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const surveyTitle = `E2E Lifecycle ${Date.now()}`;

  await createSurveyWithQuestions(userId, { title: surveyTitle, status: 'active', projectId }, 2);

  await expect(async () => {
    await page.goto(projectSurveysUrl(projectId), { waitUntil: 'networkidle' });
    await expect(listItem(page, surveyTitle)).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 25_000 });

  const row = listItem(page, surveyTitle);

  await executeMenuAction(page, row, 'Complete', 'Complete');
  await waitForToastCycle(page);
  await executeMenuAction(page, row, 'Move to Trash', 'Move to Trash');
  await waitForToast(page);
  await expect(row).not.toBeVisible({ timeout: 10_000 });
});

test('restore trashed survey from detail', async ({ page, testProject: { projectId, userId } }) => {
  const surveyTitle = `E2E Restore ${Date.now()}`;

  const { surveyId } = await createSurveyWithQuestions(
    userId,
    { title: surveyTitle, status: 'active', projectId },
    1
  );

  await updateSurveyViaDb(surveyId, {
    status: 'trashed',
    pre_trash_status: 'active',
    deleted_at: new Date().toISOString(),
  });

  await page.goto(url(`${ROUTES.dashboard.researchStats}/${surveyId}`));
  await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible({ timeout: 15_000 });
  await executeDetailAction(page, 'Restore', 'Restore');
  await waitForToast(page);
});

test('stats page loads with overview structure', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const surveyTitle = `E2E Stats ${Date.now()}`;

  const { surveyId } = await createSurveyWithQuestions(
    userId,
    { title: surveyTitle, status: 'active', projectId },
    3
  );

  await page.goto(url(`${ROUTES.dashboard.researchStats}/${surveyId}`));
  await expect(page.getByRole('heading', { name: surveyTitle })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible();
  await page.getByRole('tab', { name: /Questions/ }).click();
  await expect(page.getByText('E2E Test Question 1')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('E2E Test Question 2')).toBeVisible();
  await expect(page.getByText('E2E Test Question 3')).toBeVisible();
});
