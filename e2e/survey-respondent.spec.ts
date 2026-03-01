/**
 * Survey respondent: public survey flow (landing → answer questions → submit → thank you)
 * and closed survey states.
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
// Respondent – Full Flow
// ─────────────────────────────────────────────────────────────────
test.describe('Respondent – Full Flow', () => {
  let slug: string;

  test.beforeAll(async ({}, testInfo) => {
    const email = scopedEmail('e2e-respondent-flow', testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Respondent Flow');

    slug = generateSlug();

    await createSurveyWithQuestions(userId, { status: 'active', slug, projectId }, 2);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-respondent-flow', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('landing → start → answer → submit → thank you', async ({ page }) => {
    await page.goto(url(`/r/${slug}`));

    // Landing page: start button visible
    const startBtn = page.getByRole('button', { name: /start/i });

    await expect(startBtn).toBeVisible({ timeout: 15_000 });
    await startBtn.click();

    // Question 1: answer and proceed
    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({
      timeout: 15_000,
    });

    await expect(async () => {
      const input = page.locator('textarea, input[type="text"]').first();

      await input.fill('E2E answer to question 1');
      await expect(input).toHaveValue('E2E answer to question 1');
    }).toPass({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Question 2: answer and finish
    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(async () => {
      const input = page.locator('textarea, input[type="text"]').first();

      await input.fill('E2E answer to question 2');
      await expect(input).toHaveValue('E2E answer to question 2');
    }).toPass({ timeout: 10_000 });

    await page.getByRole('button', { name: /finish/i }).click();

    // Completion screen: submit
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /submit/i }).click();

    // Thank you screen
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Respondent – Closed Survey
// ─────────────────────────────────────────────────────────────────
test.describe('Respondent – Closed Survey', () => {
  let completedSlug: string;

  test.beforeAll(async ({}, testInfo) => {
    const email = scopedEmail('e2e-respondent-closed', testInfo.project.name);
    const userId = await ensureUser(email, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userId, 'E2E Respondent Closed');

    // Create an active survey, then mark as completed
    completedSlug = generateSlug();

    const { surveyId } = await createSurveyWithQuestions(
      userId,
      { status: 'active', slug: completedSlug, projectId },
      1
    );

    await updateSurveyViaDb(surveyId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-respondent-closed', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('completed survey shows closed message', async ({ page }) => {
    await page.goto(url(`/r/${completedSlug}`));

    // Closed state: heading visible, no start button
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────
// Respondent – Invalid Slug
// ─────────────────────────────────────────────────────────────────
test.describe('Respondent – Invalid Slug', () => {
  test('non-existent slug returns 404', async ({ page }) => {
    const response = await page.goto(url('/r/nonexistent_slug_xyz'));
    expect(response?.status()).toBe(404);
  });
});
