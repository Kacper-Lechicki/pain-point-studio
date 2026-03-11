import { expect, test } from '../fixtures';
import { fillField, waitForRealtimeConnected } from '../helpers/actions';
import {
  createAnswerViaDb,
  createResponseViaDb,
  createSurveyWithQuestions,
  generateSlug,
} from '../helpers/db-factories';
import { url } from '../helpers/routes';

test.describe('Survey responses tab', () => {
  test('shows responses already present when navigating to responses tab', async ({
    page,
    testProject: { userId, projectId },
  }) => {
    const { surveyId, questionIds } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId },
      1
    );

    for (let i = 0; i < 2; i++) {
      const responseId = await createResponseViaDb(surveyId, 'completed');
      await createAnswerViaDb(responseId, questionIds[0]!, { answer: `Answer ${i + 1}` });
    }

    await page.goto(url(`/dashboard/research/stats/${surveyId}?tab=responses`));

    const tableRows = page.locator('table tbody tr');

    await expect(tableRows).toHaveCount(2, { timeout: 15_000 });
  });

  test('new response appears in real-time via Supabase realtime', async ({
    page,
    testProject: { userId, projectId },
  }) => {
    const { surveyId, questionIds } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId },
      1
    );

    await page.goto(url(`/dashboard/research/stats/${surveyId}?tab=responses`));

    const responsesTabTrigger = page.getByRole('tab', { name: /responses/i });

    await expect(responsesTabTrigger).toBeVisible({ timeout: 15_000 });
    await expect(responsesTabTrigger).toContainText('(0)');
    await waitForRealtimeConnected(page);

    const responseId = await createResponseViaDb(surveyId, 'completed');

    await createAnswerViaDb(responseId, questionIds[0]!, { answer: 'Realtime answer' });

    await expect(async () => {
      await page
        .getByRole('button', { name: 'Refresh data' })
        .click()
        .catch(() => {});
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(1, { timeout: 3_000 });
    }).toPass({ timeout: 20_000 });

    await expect(page.getByText('Completed').first()).toBeVisible();
  });

  test('multiple responses accumulate in real-time', async ({
    page,
    testProject: { userId, projectId },
  }) => {
    const { surveyId, questionIds } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId },
      1
    );

    const firstResponse = await createResponseViaDb(surveyId, 'completed');

    await createAnswerViaDb(firstResponse, questionIds[0]!, { answer: 'First' });
    await page.goto(url(`/dashboard/research/stats/${surveyId}?tab=responses`));
    await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 15_000 });
    await waitForRealtimeConnected(page);

    const secondResponse = await createResponseViaDb(surveyId, 'completed');

    await createAnswerViaDb(secondResponse, questionIds[0]!, { answer: 'Second' });

    await expect(async () => {
      await page
        .getByRole('button', { name: 'Refresh data' })
        .click()
        .catch(() => {});
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(2, { timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  });

  test('respondent submits survey and response appears on admin stats page', async ({
    page,
    browser,
    testProject: { userId, projectId },
  }) => {
    const slug = generateSlug();

    const { surveyId } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId, slug },
      1
    );

    await page.goto(url(`/dashboard/research/stats/${surveyId}?tab=responses`));

    const responsesTabTrigger = page.getByRole('tab', { name: /responses/i });

    await expect(responsesTabTrigger).toBeVisible({ timeout: 15_000 });

    const respondentContext = await browser.newContext();
    const respondentPage = await respondentContext.newPage();

    try {
      await respondentPage.goto(url(`/r/${slug}`), { waitUntil: 'networkidle' });
      await respondentPage.getByRole('button', { name: /start/i }).click();

      await expect(respondentPage.locator('textarea, input[type="text"]').first()).toBeVisible({
        timeout: 15_000,
      });

      await fillField(
        respondentPage.locator('textarea, input[type="text"]').first(),
        'E2E realtime response'
      );

      await respondentPage.getByRole('button', { name: /finish/i }).click();

      await expect(respondentPage.getByRole('button', { name: /submit/i })).toBeVisible({
        timeout: 10_000,
      });

      await respondentPage.getByRole('button', { name: /submit/i }).click();

      await expect(respondentPage.getByRole('heading', { level: 1 })).toBeVisible({
        timeout: 15_000,
      });

      await expect(async () => {
        await page
          .getByRole('button', { name: 'Refresh data' })
          .click()
          .catch(() => {});
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(1, { timeout: 3_000 });
      }).toPass({ timeout: 25_000 });

      await expect(page.getByText('Completed').first()).toBeVisible();
    } finally {
      await respondentContext.close();
    }
  });
});
