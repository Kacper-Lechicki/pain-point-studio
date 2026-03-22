import { expect, test } from '../fixtures';
import {
  executeBannerAction,
  executeDetailAction,
  waitForToast,
  waitForToastCycle,
} from '../helpers/actions';
import { createProjectWithStatus, updateProjectViaDb } from '../helpers/db-factories';
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

test('project: completed -> trash -> restore preserves completed status', async ({
  page,
  authenticatedPage: { userId },
}) => {
  const projectId = await createProjectWithStatus(userId, 'completed', 'E2E PreTrash Status');

  await updateProjectViaDb(projectId, {
    status: 'trashed',
    deleted_at: new Date().toISOString(),
    pre_trash_status: 'completed',
  });

  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

  await expect(page.getByRole('heading', { name: 'E2E PreTrash Status' })).toBeVisible({
    timeout: 15_000,
  });

  await executeBannerAction(page, 'Restore', 'Restore');
  await waitForToast(page);
  await expect(page.getByRole('button', { name: 'Reopen', exact: true })).toBeVisible({
    timeout: 10_000,
  });
});
