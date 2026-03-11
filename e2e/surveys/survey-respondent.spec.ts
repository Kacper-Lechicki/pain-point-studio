import { expect, test } from '../fixtures';
import { fillField } from '../helpers/actions';
import { scopedEmail } from '../helpers/auth';
import {
  createProjectViaDb,
  createSurveyWithQuestions,
  generateSlug,
  updateSurveyViaDb,
} from '../helpers/db-factories';
import { url } from '../helpers/routes';
import { E2E_PASSWORD } from '../helpers/selectors';
import { deleteUserByEmail, ensureUser } from '../helpers/supabase-admin';

test('full flow: landing -> start -> answer -> submit -> thank you @webkit', async ({
  page,
}, testInfo) => {
  const email = scopedEmail('e2e-respondent-flow', testInfo.project.name);
  const userId = await ensureUser(email, E2E_PASSWORD);
  const projectId = await createProjectViaDb(userId, 'E2E Respondent Flow');
  const slug = generateSlug();

  await createSurveyWithQuestions(userId, { status: 'active', slug, projectId }, 2);

  try {
    await page.goto(url(`/r/${slug}`), { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /start/i }).click();

    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({
      timeout: 15_000,
    });

    await fillField(page.locator('textarea, input[type="text"]').first(), 'E2E answer 1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.locator('textarea, input[type="text"]').first()).toBeVisible({
      timeout: 10_000,
    });

    await fillField(page.locator('textarea, input[type="text"]').first(), 'E2E answer 2');
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByRole('button', { name: /submit/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('completed survey shows closed message', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-respondent-completed', testInfo.project.name);
  const userId = await ensureUser(email, E2E_PASSWORD);
  const projectId = await createProjectViaDb(userId, 'E2E Respondent Completed');
  const slug = generateSlug();

  const { surveyId } = await createSurveyWithQuestions(
    userId,
    { status: 'active', slug, projectId },
    1
  );

  await updateSurveyViaDb(surveyId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  try {
    await page.goto(url(`/r/${slug}`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('cancelled survey shows closed message', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-respondent-cancelled', testInfo.project.name);
  const userId = await ensureUser(email, E2E_PASSWORD);
  const projectId = await createProjectViaDb(userId, 'E2E Respondent Cancelled');
  const slug = generateSlug();

  const { surveyId } = await createSurveyWithQuestions(
    userId,
    { status: 'active', slug, projectId },
    1
  );

  await updateSurveyViaDb(surveyId, { status: 'cancelled' });

  try {
    await page.goto(url(`/r/${slug}`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('archived survey shows closed message', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-respondent-archived', testInfo.project.name);
  const userId = await ensureUser(email, E2E_PASSWORD);
  const projectId = await createProjectViaDb(userId, 'E2E Respondent Archived');
  const slug = generateSlug();

  const { surveyId } = await createSurveyWithQuestions(
    userId,
    { status: 'active', slug, projectId },
    1
  );

  await updateSurveyViaDb(surveyId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });

  await updateSurveyViaDb(surveyId, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });

  try {
    await page.goto(url(`/r/${slug}`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /start/i })).not.toBeVisible();
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('draft survey returns 404', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-respondent-draft', testInfo.project.name);
  const userId = await ensureUser(email, E2E_PASSWORD);
  const projectId = await createProjectViaDb(userId, 'E2E Respondent Draft');
  const slug = generateSlug();

  await createSurveyWithQuestions(userId, { status: 'draft', slug, projectId }, 1);

  try {
    const response = await page.goto(url(`/r/${slug}`));
    expect(response?.status()).toBe(404);
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('non-existent slug returns 404', async ({ page }) => {
  const response = await page.goto(url('/r/nonexistent_slug_xyz'));
  expect(response?.status()).toBe(404);
});
