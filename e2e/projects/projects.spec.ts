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
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[0-9a-f-]+/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible({ timeout: 15_000 });
});

test('edit project via settings page', async ({ page, testProject: { projectId } }) => {
  const admin = getAdminClient();

  await admin.from('projects').update({ summary: 'E2E test summary' }).eq('id', projectId);
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}/settings`), {
    waitUntil: 'networkidle',
  });

  await expect(page.locator(sel.projectSettingsName)).toBeVisible({ timeout: 15_000 });
  await fillField(page.locator(sel.projectSettingsName), 'E2E Updated Name');
  await page.locator(sel.projectSettingsSubmit).click();

  await waitForToast(page);

  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), {
    waitUntil: 'networkidle',
  });

  await expect(page.getByRole('heading', { name: 'E2E Updated Name' })).toBeVisible({
    timeout: 15_000,
  });
});

test('delete project permanently from settings', async ({ page, testProject: { userId } }) => {
  const projectName = `E2E Delete ${Date.now()}`;

  const projectId = await createProjectViaDb(userId, projectName);

  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}/settings/danger-zone`), {
    waitUntil: 'networkidle',
  });

  await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Delete Project' }).first().click();

  const dialog = page.locator(sel.dialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await fillField(dialog.locator(sel.confirmation), projectName);
  await dialog.getByRole('button', { name: 'Delete Project Forever' }).click();

  await waitForToast(page);

  await page.goto(url(ROUTES.dashboard.projects), { waitUntil: 'networkidle' });
  await expect(page.getByText(projectName)).not.toBeVisible({ timeout: 10_000 });
});

test('quick actions trigger status change via header menu', async ({
  page,
  testProject: { projectId },
}) => {
  await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), {
    waitUntil: 'networkidle',
  });

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /more actions/i }).click();
  await page.getByRole('menuitem', { name: /complete/i }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await dialog.getByRole('button', { name: /complete/i }).click();

  await waitForToast(page);
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
