/**
 * Dashboard page: empty state, populated state with greeting and time filter.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { createProjectWithSurveys } from './helpers/project-admin';
import { E2E_PASSWORD } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import { createProjectViaDb } from './helpers/survey-admin';

// ─────────────────────────────────────────────────────────────────
// Dashboard – Empty State
// ─────────────────────────────────────────────────────────────────
test.describe('Dashboard – Empty State', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-dashboard-empty', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-dashboard-empty', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('shows empty state with CTA to create first project', async ({ page }) => {
    await signIn(page);

    // Empty state renders a link to the create-project wizard
    await expect(page.getByRole('link', { name: /project/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Dashboard – Populated
// ─────────────────────────────────────────────────────────────────
test.describe('Dashboard – Populated', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-dashboard-pop', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);

    // Create 2 projects: one with surveys for meaningful stats
    await createProjectWithSurveys(userId, 2, 'E2E Dashboard Project A');
    await createProjectViaDb(userId, 'E2E Dashboard Project B');
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-dashboard-pop', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('shows greeting and project names', async ({ page }) => {
    await signIn(page);

    // Greeting renders "Welcome, {firstName}" in <h1> — firstName is "E2E" (from "E2E User")
    await expect(page.getByRole('heading', { name: /welcome/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    // Both project names visible on the dashboard
    await expect(page.getByText('E2E Dashboard Project A')).toBeVisible();
    await expect(page.getByText('E2E Dashboard Project B')).toBeVisible();
  });

  test('time filter updates URL period parameter', async ({ page }) => {
    await signIn(page);
    await expect(page.getByRole('heading', { name: /welcome/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    // DashboardTimeFilter renders <a> links with labels "7d", "30d", "90d"
    // webkit can swallow clicks during hydration — retry pattern
    await expect(async () => {
      await page.getByRole('link', { name: '7d' }).first().click();
      await expect(page).toHaveURL(/period=7/);
    }).toPass({ timeout: 15_000 });
  });
});
