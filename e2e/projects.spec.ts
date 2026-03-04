/**
 * Project CRUD: empty state, create wizard, inline edit, trash from list.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser, getAdminClient } from './helpers/supabase-admin';
import { createProjectViaDb } from './helpers/survey-admin';

/**
 * Finds the project row/card element containing the given name.
 * Works for both desktop (table row) and mobile (card list) layouts.
 */
function projectItem(page: import('@playwright/test').Page, name: string) {
  return page.locator('tr, [role="list"] > *').filter({ hasText: name });
}

/**
 * Opens the "More actions" dropdown on a project row/card, clicks a menu item,
 * and optionally confirms the alert dialog.
 */
async function executeProjectAction(
  page: import('@playwright/test').Page,
  projectName: string,
  menuItemName: string,
  confirmButtonName?: string
) {
  const row = projectItem(page, projectName);

  await expect(row).toBeVisible({ timeout: 15_000 });

  await expect(async () => {
    await page.locator('body').click({ position: { x: 0, y: 0 } });
    await row.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menuitem', { name: menuItemName })).toBeVisible();
  }).toPass({ timeout: 10_000 });

  await page.getByRole('menuitem', { name: menuItemName }).click();

  if (confirmButtonName) {
    const dialog = page.locator(sel.alertDialog);

    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: confirmButtonName }).click();
  }
}

// ─────────────────────────────────────────────────────────────────
// Projects – Empty State
// ─────────────────────────────────────────────────────────────────
test.describe('Projects – Empty State', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-projects-empty', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-projects-empty', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('shows empty state with CTA to create project', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.projects));

    await expect(page.getByRole('link', { name: /project/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Projects – Create Wizard
// ─────────────────────────────────────────────────────────────────
test.describe('Projects – Create Wizard', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  const PROJECT_NAME = `E2E Wizard ${Date.now()}`;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-projects-create', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-projects-create', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('name → summary → description → confirm → image → project detail', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.projectNew));

    // Step 1: Name — webkit can swallow fill during hydration, so retry the whole transition
    await expect(page.locator(sel.nameInput)).toBeVisible({ timeout: 15_000 });

    await expect(async () => {
      await page.locator(sel.nameInput).fill(PROJECT_NAME);
      await expect(page.locator(sel.nameInput)).toHaveValue(PROJECT_NAME);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.locator(sel.summaryInput)).toBeVisible();
    }).toPass({ timeout: 15_000 });

    // Step 2: Summary
    await expect(async () => {
      await page.locator(sel.summaryInput).fill('E2E test summary');
      await expect(page.locator(sel.summaryInput)).toHaveValue('E2E test summary');
    }).toPass({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 3: Description — skip
    await expect(page.getByText('Step 3 of 4')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Step 4: Review + Submit
    await expect(page.getByRole('button', { name: 'Create Project' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(PROJECT_NAME)).toBeVisible();
    await page.getByRole('button', { name: 'Create Project' }).click();

    // Image step: success message then go to project
    await expect(page.getByText('Your project has been created!')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Go to project' }).click();

    // Redirected to project detail page
    await expect(page).toHaveURL(/\/dashboard\/projects\/[0-9a-f-]+/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: PROJECT_NAME })).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Projects – Inline Edit
// ─────────────────────────────────────────────────────────────────
test.describe('Projects – Inline Edit', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let projectId: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-projects-edit', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    projectId = await createProjectViaDb(userId, 'E2E Editable Project');

    // Project needs a summary so the updateProject schema validation passes
    const admin = getAdminClient();

    await admin.from('projects').update({ summary: 'E2E test summary' }).eq('id', projectId);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-projects-edit', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('edit project name inline on detail page', async ({ page }) => {
    await signIn(page);
    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`));

    await expect(page.getByRole('heading', { name: 'E2E Editable Project' })).toBeVisible({
      timeout: 15_000,
    });

    // Click the pencil edit button (has aria-label "Edit project name")
    await page.getByRole('button', { name: 'Edit project name' }).click();

    // Input appears with current name — clear and fill with new name
    await expect(async () => {
      const input = page.getByRole('textbox');

      await input.clear();
      await input.fill('E2E Updated Name');
      await expect(input).toHaveValue('E2E Updated Name');
    }).toPass({ timeout: 10_000 });

    // Click the save button (default variant, icon-xs size — the primary-colored one)
    await page.locator('button[data-variant="default"][data-size="icon-xs"]').click();

    // Heading should reflect the new name
    await expect(page.getByRole('heading', { name: 'E2E Updated Name' })).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Projects – Trash from List
// ─────────────────────────────────────────────────────────────────
test.describe('Projects – Trash from List', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;
  let projectName: string;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-projects-trash', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);
    projectName = `E2E Trash ${Date.now()}`;
    await createProjectViaDb(userId, projectName);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-projects-trash', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('trash project via More actions menu on list page', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.dashboard.projects));

    await executeProjectAction(page, projectName, 'Move to Trash', 'Move to Trash');
    await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });

    // Project should disappear from the default list (active filter)
    await expect(projectItem(page, projectName)).not.toBeVisible({ timeout: 10_000 });
  });
});
