/**
 * Survey lifecycle from the respondent perspective:
 * verifies respondent access is correctly gated by survey status.
 *
 * Complements surveys.spec.ts (admin-side lifecycle) and
 * survey-respondent.spec.ts (happy-path flow + completed closed state).
 *
 * Tests here cover: draft (404), cancelled (closed), archived (closed).
 */
import { expect, test } from '@playwright/test';

import { scopedEmail } from './helpers/auth';
import { url } from './helpers/routes';
import { E2E_PASSWORD } from './helpers/selectors';
import { deleteUserByEmail, ensureUser } from './helpers/supabase-admin';
import {
  createProjectViaDb,
  createSurveyWithQuestions,
  generateSlug,
  updateSurveyViaDb,
} from './helpers/survey-admin';

// ─────────────────────────────────────────────────────────────────
// Survey Respondent – Draft Not Accessible
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Respondent – Draft Not Accessible', () => {
  let slug: string;

  test.beforeAll(async ({}, testInfo) => {
    const email = scopedEmail('e2e-srl-draft', testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E SRL Draft');

    slug = generateSlug();
    await createSurveyWithQuestions(userId, { projectId, slug, status: 'draft' }, 1);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-srl-draft', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('draft survey returns 404 for respondent', async ({ page }) => {
    const response = await page.goto(url(`/r/${slug}`));

    // Draft surveys should not be publicly accessible
    expect(response?.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Respondent – Cancelled Shows Closed
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Respondent – Cancelled Shows Closed', () => {
  let slug: string;

  test.beforeAll(async ({}, testInfo) => {
    const email = scopedEmail('e2e-srl-cancelled', testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E SRL Cancelled');

    slug = generateSlug();
    const { surveyId } = await createSurveyWithQuestions(
      userId,
      { projectId, slug, status: 'active' },
      1
    );

    // Cancel the survey
    await updateSurveyViaDb(surveyId, { status: 'cancelled' });
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-srl-cancelled', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('cancelled survey shows closed message', async ({ page }) => {
    await page.goto(url(`/r/${slug}`));

    // The page should load (not 404) but show a "closed" state
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    // No "Start" button should be present
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Survey Respondent – Archived Shows Closed
// ─────────────────────────────────────────────────────────────────
test.describe('Survey Respondent – Archived Shows Closed', () => {
  let slug: string;

  test.beforeAll(async ({}, testInfo) => {
    const email = scopedEmail('e2e-srl-archived', testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E SRL Archived');

    slug = generateSlug();
    const { surveyId } = await createSurveyWithQuestions(
      userId,
      { projectId, slug, status: 'active' },
      1
    );

    // Complete then archive via DB
    await updateSurveyViaDb(surveyId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    await updateSurveyViaDb(surveyId, {
      status: 'archived',
      archived_at: new Date().toISOString(),
    });
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-srl-archived', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('archived survey shows closed message', async ({ page }) => {
    await page.goto(url(`/r/${slug}`));

    // The page should load (not 404) but show a "closed" state
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    // No "Start" button should be present
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  });
});
