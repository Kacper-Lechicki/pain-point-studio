import { expect, test } from '../fixtures';
import { fillField, waitForRealtimeConnected } from '../helpers/actions';
import {
  createAnswerViaDb,
  createResponseViaDb,
  createSurveyWithQuestions,
  generateSlug,
} from '../helpers/db-factories';
import { url } from '../helpers/routes';
import { sel } from '../helpers/selectors';

const responseListItem = '[role="button"][aria-label^="Response #"]';

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

    const items = page.locator(responseListItem);

    await expect(items).toHaveCount(2, { timeout: 15_000 });
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
      const items = page.locator(responseListItem);
      await expect(items).toHaveCount(1, { timeout: 3_000 });
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
    await expect(page.locator(responseListItem)).toHaveCount(1, { timeout: 15_000 });
    await waitForRealtimeConnected(page);

    const secondResponse = await createResponseViaDb(surveyId, 'completed');

    await createAnswerViaDb(secondResponse, questionIds[0]!, { answer: 'Second' });

    await expect(async () => {
      await page
        .getByRole('button', { name: 'Refresh data' })
        .click()
        .catch(() => {});
      const items = page.locator(responseListItem);
      await expect(items).toHaveCount(2, { timeout: 3_000 });
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
        const items = page.locator(responseListItem);
        await expect(items).toHaveCount(1, { timeout: 3_000 });
      }).toPass({ timeout: 25_000 });

      await expect(page.getByText('Completed').first()).toBeVisible();
    } finally {
      await respondentContext.close();
    }
  });

  test('clicking response item shows detail with answer', async ({
    page,
    testProject: { userId, projectId },
  }) => {
    const { surveyId, questionIds } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId },
      1
    );

    const responseId = await createResponseViaDb(surveyId, 'completed');
    await createAnswerViaDb(responseId, questionIds[0]!, { text: 'Detail view answer' });

    await page.goto(url(`/dashboard/research/stats/${surveyId}?tab=responses`));
    await expect(page.locator(responseListItem)).toHaveCount(1, { timeout: 15_000 });
    await page.locator(responseListItem).first().click();

    await expect(page.getByText('Detail view answer')).toBeVisible({ timeout: 10_000 });
  });

  test('export dialog opens from stats header menu', async ({
    page,
    testProject: { userId, projectId },
  }) => {
    const { surveyId, questionIds } = await createSurveyWithQuestions(
      userId,
      { status: 'active', projectId },
      1
    );

    const responseId = await createResponseViaDb(surveyId, 'completed');
    await createAnswerViaDb(responseId, questionIds[0]!, { answer: 'Export test' });

    await page.goto(url(`/dashboard/research/stats/${surveyId}`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.keyboard.press('Escape');
      await page
        .locator(`${sel.alertDialog}, [role="menu"]`)
        .first()
        .waitFor({ state: 'hidden', timeout: 3_000 })
        .catch(() => {});
      await page.getByRole('button', { name: /more actions/i }).click();
      const exportItem = page.getByRole('menuitem', { name: /export/i });
      await expect(exportItem).toBeVisible({ timeout: 3_000 });
      await exportItem.click();
    }).toPass({ timeout: 15_000 });

    const dialog = page.locator(sel.dialog);

    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/csv spreadsheet/i)).toBeVisible();
    await expect(dialog.getByText(/json data/i)).toBeVisible();
  });
});
