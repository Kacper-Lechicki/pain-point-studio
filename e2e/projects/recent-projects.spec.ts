import { expect, test } from '../fixtures';
import { createProjectViaDb } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('recent projects sidebar', () => {
  test('empty state shows "No recently opened projects"', async ({
    page,
    authenticatedPage: {},
  }) => {
    await page.goto(url(ROUTES.dashboard.projects), { waitUntil: 'networkidle' });
    await expect(page.getByText('No recently opened projects')).toBeVisible({ timeout: 15_000 });
  });

  test('visiting a project adds it to the recent list in sidebar', async ({
    page,
    authenticatedPage: { userId },
  }) => {
    const projectName = `E2E Recent ${Date.now()}`;
    const projectId = await createProjectViaDb(userId, projectName);

    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible({ timeout: 15_000 });

    await page.goto(url(ROUTES.dashboard.projects), { waitUntil: 'networkidle' });
    await expect(page.getByText('Recent', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('nav').getByRole('link', { name: projectName })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('recent projects are ordered most recent first', async ({
    page,
    authenticatedPage: { userId },
  }) => {
    const projectA = `E2E First ${Date.now()}`;
    const projectB = `E2E Second ${Date.now()}`;
    const idA = await createProjectViaDb(userId, projectA);
    const idB = await createProjectViaDb(userId, projectB);

    await page.goto(url(`${ROUTES.dashboard.projects}/${idA}`), { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: projectA })).toBeVisible({ timeout: 15_000 });

    await page.goto(url(`${ROUTES.dashboard.projects}/${idB}`), { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: projectB })).toBeVisible({ timeout: 15_000 });

    await page.goto(url(ROUTES.dashboard.projects), { waitUntil: 'networkidle' });

    const recentLinks = page
      .locator('nav')
      .getByRole('link', { name: projectA })
      .or(page.locator('nav').getByRole('link', { name: projectB }));

    await expect(recentLinks).toHaveCount(2, { timeout: 10_000 });
  });

  test('clicking a recent project navigates to its detail page', async ({
    page,
    authenticatedPage: { userId },
  }) => {
    const projectName = `E2E Navigate ${Date.now()}`;
    const projectId = await createProjectViaDb(userId, projectName);

    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible({ timeout: 15_000 });

    await page.goto(url(ROUTES.dashboard.projects), { waitUntil: 'networkidle' });

    const recentLink = page.locator('nav').getByRole('link', { name: projectName });
    await expect(recentLink).toBeVisible({ timeout: 10_000 });
    await recentLink.click();

    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${projectId}`), {
      timeout: 15_000,
    });
  });
});

test.describe('recent projects in command palette', () => {
  test('command palette shows recently visited project', async ({
    page,
    authenticatedPage: { userId },
  }) => {
    const projectName = `E2E Palette ${Date.now()}`;
    const projectId = await createProjectViaDb(userId, projectName);

    await page.goto(url(`${ROUTES.dashboard.projects}/${projectId}`), {
      waitUntil: 'networkidle',
    });
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible({ timeout: 15_000 });

    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Recent Projects')).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByLabel('Recent Projects').getByRole('option', { name: projectName })
    ).toBeVisible();
  });
});
