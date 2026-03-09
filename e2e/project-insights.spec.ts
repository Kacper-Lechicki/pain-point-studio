import { expect, test } from './fixtures';
import { executeMenuAction, listItem, waitForToast, waitForToastCycle } from './helpers/actions';
import { ROUTES, url } from './helpers/routes';
import { createCompletedSurveyWithResponses, updateSurveyViaDb } from './helpers/survey-admin';

function projectInsightsUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}?tab=insights`);
}

function projectSurveysUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}?tab=surveys`);
}

test('pending banner appears for completed survey', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const { surveyId } = await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const banner = page.locator('[data-testid="pending-insights-banner"]');

  await expect(banner).toBeVisible({ timeout: 15_000 });

  const card = page.locator(`[data-testid="pending-survey-${surveyId}"]`);

  await expect(card).toBeVisible();
});

test('include survey → pending card disappears', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const { surveyId } = await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const card = page.locator(`[data-testid="pending-survey-${surveyId}"]`);

  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: 'Include' }).click();
  await waitForToast(page);
  await expect(card).not.toBeVisible({ timeout: 10_000 });
});

test('exclude survey → pending card disappears', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const { surveyId } = await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const card = page.locator(`[data-testid="pending-survey-${surveyId}"]`);

  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.getByRole('button', { name: 'Exclude' }).click();
  await waitForToast(page);
  await expect(card).not.toBeVisible({ timeout: 10_000 });
});

test('reopen survey resets insight preference', async ({
  page,
  testProject: { projectId, userId },
}) => {
  const { surveyId, title: surveyTitle } = await createCompletedSurveyWithResponses(
    userId,
    projectId,
    5
  );

  await updateSurveyViaDb(surveyId, { generate_insights: true });
  await page.goto(projectSurveysUrl(projectId));

  const row = listItem(page, surveyTitle);

  await expect(row).toBeVisible({ timeout: 15_000 });
  await executeMenuAction(page, row, 'Reopen', 'Reopen');
  await waitForToastCycle(page);
  await executeMenuAction(page, row, 'Complete', 'Complete');
  await waitForToastCycle(page);
  await page.goto(projectInsightsUrl(projectId));

  const banner = page.locator('[data-testid="pending-insights-banner"]');

  await expect(banner).toBeVisible({ timeout: 15_000 });

  const card = page.locator(`[data-testid="pending-survey-${surveyId}"]`);

  await expect(card).toBeVisible();
});
