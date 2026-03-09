import { expect, test } from './fixtures';
import { ROUTES, url } from './helpers/routes';
import { getAdminClient } from './helpers/supabase-admin';
import { createProjectViaDb, createSurveyWithQuestions } from './helpers/survey-admin';

test('profile shows full name, bio, member since, and research journey', async ({
  page,
  authenticatedPage: { userId },
}) => {
  const admin = getAdminClient();

  await admin
    .from('profiles')
    .update({ bio: 'E2E test bio for profile preview.' })
    .eq('id', userId);

  const projectId = await createProjectViaDb(userId, 'E2E Profile Project');

  await createSurveyWithQuestions(userId, { projectId, status: 'active' }, 1);
  await page.goto(url(ROUTES.profile.preview));

  await expect(page.getByRole('heading', { name: 'E2E User', level: 2 })).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByText('E2E test bio for profile preview.')).toBeVisible();
  await expect(page.getByText(/member since/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /research journey/i, level: 3 })).toBeVisible();
});

test('empty bio renders without errors', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.profile.preview));

  await expect(page.getByRole('heading', { name: 'E2E User', level: 2 })).toBeVisible({
    timeout: 15_000,
  });

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
