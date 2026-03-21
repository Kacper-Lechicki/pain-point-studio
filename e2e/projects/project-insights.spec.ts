import { expect, test } from '../fixtures';
import { createCompletedSurveyWithResponses } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';

function projectInsightsUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}?tab=insights`);
}

test('suggestions appear for completed survey', async ({
  page,
  testProject: { projectId, userId },
}) => {
  await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const suggestedColumn = page.locator('[data-column-id="suggested"]');

  await expect(suggestedColumn).toBeVisible({ timeout: 15_000 });

  const suggestionCard = suggestedColumn.locator('[data-insight-id]').first();

  await expect(suggestionCard).toBeVisible({ timeout: 10_000 });
});

test('accept suggestion → moves to insight column', async ({
  page,
  testProject: { projectId, userId },
}) => {
  await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const suggestedColumn = page.locator('[data-column-id="suggested"]');
  const suggestionCard = suggestedColumn.locator('[data-insight-id]').first();

  await expect(suggestionCard).toBeVisible({ timeout: 15_000 });

  const initialCount = await suggestedColumn.locator('[data-insight-id]').count();

  await suggestionCard.getByRole('button', { name: 'Actions' }).click();

  const moveToItem = page.getByRole('menuitem', { name: 'Move to' });

  await expect(moveToItem).toBeVisible({ timeout: 5_000 });
  await moveToItem.click();

  const strengthItem = page.getByRole('menuitem', { name: 'Strength' });

  await expect(strengthItem).toBeVisible({ timeout: 5_000 });
  await strengthItem.click();

  const strengthColumn = page.locator('[data-column-id="strength"]');

  await expect(strengthColumn.locator('[data-insight-id]').first()).toBeVisible({
    timeout: 10_000,
  });
  await expect(suggestedColumn.locator('[data-insight-id]')).toHaveCount(initialCount - 1, {
    timeout: 10_000,
  });
});

test('dismiss suggestion → card disappears', async ({
  page,
  testProject: { projectId, userId },
}) => {
  await createCompletedSurveyWithResponses(userId, projectId, 5);

  await page.goto(projectInsightsUrl(projectId));

  const suggestedColumn = page.locator('[data-column-id="suggested"]');
  const suggestionCard = suggestedColumn.locator('[data-insight-id]').first();

  await expect(suggestionCard).toBeVisible({ timeout: 15_000 });

  const initialCount = await suggestedColumn.locator('[data-insight-id]').count();

  await suggestionCard.getByRole('button', { name: 'Actions' }).click();

  const dismissItem = page.getByRole('menuitem', { name: 'Dismiss' });

  await expect(dismissItem).toBeVisible({ timeout: 5_000 });
  await dismissItem.click();

  await expect(suggestedColumn.locator('[data-insight-id]')).toHaveCount(initialCount - 1, {
    timeout: 10_000,
  });
});

test('add insight via dialog', async ({ page, testProject: { projectId } }) => {
  await page.goto(projectInsightsUrl(projectId));

  const addButton = page.getByRole('button', { name: 'Add Insight' });

  await expect(addButton).toBeVisible({ timeout: 15_000 });
  await addButton.click();

  const dialog = page.getByRole('dialog');

  await expect(dialog).toBeVisible({ timeout: 10_000 });

  await dialog.locator('textarea').fill('E2E test insight content');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  const strengthColumn = page.locator('[data-column-id="strength"]');

  await expect(strengthColumn.getByText('E2E test insight content')).toBeVisible({
    timeout: 10_000,
  });
});
