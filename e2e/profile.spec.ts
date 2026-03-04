/**
 * Profile preview page: displays user info, bio, member since, research journey.
 */
import { expect, test } from '@playwright/test';

import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD } from './helpers/selectors';
import { deleteUserByEmail, ensureUser, getAdminClient } from './helpers/supabase-admin';
import { createProjectViaDb, createSurveyWithQuestions } from './helpers/survey-admin';

// ─────────────────────────────────────────────────────────────────
// Profile Preview – Basic Info
// ─────────────────────────────────────────────────────────────────
test.describe('Profile Preview – Basic Info', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-profile-preview', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    const userId = await ensureUser(email, E2E_PASSWORD);

    // Update profile with bio for richer preview
    const admin = getAdminClient();

    await admin
      .from('profiles')
      .update({ bio: 'E2E test bio for profile preview.' })
      .eq('id', userId);

    // Create project + active survey to populate research journey milestones
    const projectId = await createProjectViaDb(userId, 'E2E Profile Project');

    await createSurveyWithQuestions(userId, { projectId, status: 'active' }, 1);
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-profile-preview', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('shows full name, bio, and member since', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.profile.preview));

    // ProfileHeader renders fullName in <h2>
    await expect(page.getByRole('heading', { name: 'E2E User', level: 2 })).toBeVisible({
      timeout: 15_000,
    });

    // Bio text
    await expect(page.getByText('E2E test bio for profile preview.')).toBeVisible();

    // Member since (CalendarDays icon + "Member since" text)
    await expect(page.getByText(/member since/i)).toBeVisible();
  });

  test('shows research journey section', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.profile.preview));

    await expect(page.getByRole('heading', { name: 'E2E User', level: 2 })).toBeVisible({
      timeout: 15_000,
    });

    // ResearchJourney renders <h3> with "Research Journey" title
    await expect(page.getByRole('heading', { name: /research journey/i, level: 3 })).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// Profile Preview – Empty Bio
// ─────────────────────────────────────────────────────────────────
test.describe('Profile Preview – Empty Bio', () => {
  let email: string;
  let signIn: ReturnType<typeof makeApiSignIn>;

  test.beforeAll(async ({}, testInfo) => {
    email = scopedEmail('e2e-profile-empty', testInfo.project.name);
    signIn = makeApiSignIn(email, E2E_PASSWORD);
    await ensureUser(email, E2E_PASSWORD);
    // No bio, no projects → minimal profile
  });

  test.afterAll(async ({}, testInfo) => {
    const e = scopedEmail('e2e-profile-empty', testInfo.project.name);
    await deleteUserByEmail(e).catch(() => {});
  });

  test('shows name and renders without errors', async ({ page }) => {
    await signIn(page);
    await page.goto(url(ROUTES.profile.preview));

    // Name should still be visible
    await expect(page.getByRole('heading', { name: 'E2E User', level: 2 })).toBeVisible({
      timeout: 15_000,
    });

    // Page should fully load without errors — verify the page title heading too
    // ProfileView renders <h1> with profile.preview.title i18n key
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
