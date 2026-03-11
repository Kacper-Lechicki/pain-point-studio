import { expect, test } from '../fixtures';
import { executeMenuAction, fillField, listItem, waitForToast } from '../helpers/actions';
import { createProjectViaDb } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';
import { sel } from '../helpers/selectors';
import { getAdminClient } from '../helpers/supabase-admin';

test('empty state shows CTA to create project', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.dashboard.projects));
  await expect(page.getByRole('link', { name: /project/i })).toBeVisible({ timeout: 15_000 });
});

test('create wizard: name -> summary -> description -> confirm -> project detail', async ({
  page,
  authenticatedPage: {},
}) => {
  const PROJECT_NAME = `E2E Wizard ${Date.now()}`;

  await page.goto(url(ROUTES.dashboard.projectNew), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.nameInput)).toBeVisible({ timeout: 15_000 });
  await fillField(page.locator(sel.nameInput), PROJECT_NAME);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator(sel.summaryInput)).toBeVisible({ timeout: 10_000 });
  await fillField(page.locator(sel.summaryInput), 'E2E test summary');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Step 3 of 4')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Create Project' })).toBeVisible({
    timeout: 10_000,
  });

  await expect(page.getByText(PROJECT_NAME)).toBeVisible();
  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page.getByText('Your project has been created!')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Go to project' }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible({ timeout: 15_000 });
});

test('edit project name inline on detail page', async ({ page, testProject: { projectId } }) => {
  const admin = getAdminClient();

  await admin.from('projects').update({ summary: 'E2E test summary' }).eq('id', projectId);
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole('heading', { name: 'E2E Test Project' }).click();
  await expect(page.getByRole('textbox')).toBeVisible({ timeout: 5_000 });
  await fillField(page.getByRole('textbox'), 'E2E Updated Name');
  await page.locator('button[data-variant="default"][data-size="icon-xs"]').click();

  await expect(page.getByRole('heading', { name: 'E2E Updated Name' })).toBeVisible({
    timeout: 15_000,
  });
});

test('trash project via More actions menu on list page', async ({
  page,
  testProject: { userId },
}) => {
  const projectName = `E2E Trash ${Date.now()}`;

  await createProjectViaDb(userId, projectName);
  await page.goto(url(ROUTES.dashboard.projects));

  const row = listItem(page, projectName);

  await executeMenuAction(page, row, 'Move to Trash', 'Move to Trash');
  await waitForToast(page);
  await expect(row).not.toBeVisible({ timeout: 10_000 });
});
