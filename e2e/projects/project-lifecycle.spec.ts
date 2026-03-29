import { expect, test } from '../fixtures';
import {
  executeBannerAction,
  executeDetailAction,
  waitForToast,
  waitForToastCycle,
} from '../helpers/actions';
import { createProjectWithStatus, updateProjectViaDb } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';

test('project: active -> complete', async ({ page, testProject: { projectId } }) => {
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

  await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible({
    timeout: 15_000,
  });

  await executeDetailAction(page, 'Complete', 'Complete');
  await waitForToast(page);
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

  // After restore, project should be completed (not trashed) — verify completed badge visible
  await expect(page.getByText('Completed')).toBeVisible({ timeout: 10_000 });
});
