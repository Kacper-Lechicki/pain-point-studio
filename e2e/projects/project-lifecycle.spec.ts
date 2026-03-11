import { expect, test } from '../fixtures';
import { executeBannerAction, executeDetailAction, waitForToastCycle } from '../helpers/actions';
import { ROUTES, url } from '../helpers/routes';

test('project: active -> complete -> reopen', async ({ page, testProject: { projectId } }) => {
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

  await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible({
    timeout: 15_000,
  });

  await executeDetailAction(page, 'Complete', 'Complete');
  await waitForToastCycle(page);
  await executeBannerAction(page, 'Reopen', 'Reopen');
  await waitForToastCycle(page);
});

test('project: active -> archive -> restore', async ({ page, testProject: { projectId } }) => {
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

  await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible({
    timeout: 15_000,
  });

  await executeDetailAction(page, 'Archive', 'Archive');
  await waitForToastCycle(page);
  await executeBannerAction(page, 'Restore', 'Restore');
  await waitForToastCycle(page);
});

test('project: active -> trash -> restore', async ({ page, testProject: { projectId } }) => {
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

  await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible({
    timeout: 15_000,
  });

  await executeDetailAction(page, 'Move to Trash', 'Move to Trash');
  await waitForToastCycle(page);
  await executeBannerAction(page, 'Restore', 'Restore');
  await waitForToastCycle(page);
});
