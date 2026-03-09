import { expect, test } from './fixtures';
import { createProjectWithSurveys } from './helpers/project-admin';
import { createProjectViaDb } from './helpers/survey-admin';

test('empty state shows CTA to create first project', async ({ authenticatedPage: {}, page }) => {
  await expect(page.getByRole('link', { name: /project/i })).toBeVisible({ timeout: 15_000 });
});

test('populated dashboard shows greeting and project names', async ({
  page,
  authenticatedPage: { userId },
}) => {
  await createProjectWithSurveys(userId, 2, 'E2E Dashboard Project A');
  await createProjectViaDb(userId, 'E2E Dashboard Project B');
  await page.reload();

  await expect(page.getByRole('heading', { name: /welcome/i, level: 1 })).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByText('E2E Dashboard Project A')).toBeVisible();
  await expect(page.getByText('E2E Dashboard Project B')).toBeVisible();
});

test('pin and unpin project on dashboard', async ({ page, authenticatedPage: { userId } }) => {
  await createProjectViaDb(userId, 'E2E Pin Project');
  await page.reload();
  await expect(page.getByText('E2E Pin Project')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Pin', exact: true }).click();

  await expect(page.locator('button[aria-label="Unpin"]:not([disabled])').first()).toBeVisible({
    timeout: 5_000,
  });

  await page.locator('button[aria-label="Unpin"]:not([disabled])').first().click();

  await expect(page.getByRole('button', { name: 'Pin', exact: true })).toBeVisible({
    timeout: 5_000,
  });
});

test('time filter updates URL period parameter', async ({
  page,
  authenticatedPage: { userId },
}) => {
  await createProjectViaDb(userId, 'E2E Filter Project');
  await page.reload();

  await expect(page.getByRole('heading', { name: /welcome/i, level: 1 })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('link', { name: '7d' }).first().click();
  await expect(page).toHaveURL(/period=7/);
});
