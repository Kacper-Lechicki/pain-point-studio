import { expect, test } from './fixtures';
import { waitForToast } from './helpers/actions';
import { makeApiSignIn, scopedEmail } from './helpers/auth';
import { ensureUserWithOAuthIdentity } from './helpers/identity-admin';
import { ROUTES, url } from './helpers/routes';
import { E2E_PASSWORD, sel } from './helpers/selectors';
import { deleteUserByEmail, ensureUser, getAdminClient } from './helpers/supabase-admin';
import { createProjectViaDb } from './helpers/survey-admin';

// ---------------------------------------------------------------------------
// Connected Accounts — Multi-Identity
// ---------------------------------------------------------------------------

test.describe('Connected Accounts — Multi-Identity', () => {
  test('user with email+password and GitHub sees both connected', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-multi-id', testInfo.project.name);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);

    await ensureUserWithOAuthIdentity(email, E2E_PASSWORD, 'github');

    try {
      await signIn(page);
      await page.goto(url(ROUTES.settings.connectedAccounts));

      const main = page.getByRole('main');

      await expect(main).toBeVisible({ timeout: 15_000 });

      const rows = main.locator('.rounded-lg.border');

      await expect(rows).toHaveCount(3, { timeout: 10_000 });

      const githubRow = rows.filter({ has: page.locator('.lucide-github') });

      await expect(githubRow).toContainText(email);

      const googleRow = rows.nth(2);

      await expect(googleRow).toBeVisible();

      const unlinkBtn = githubRow.locator('button').filter({ has: page.locator('.lucide-unlink') });

      await expect(unlinkBtn).toBeVisible();
      await expect(unlinkBtn).toBeEnabled();
    } finally {
      await deleteUserByEmail(email).catch(() => {});
    }
  });

  test('unlink GitHub identity via confirm dialog', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-unlink-id', testInfo.project.name);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);

    await ensureUserWithOAuthIdentity(email, E2E_PASSWORD, 'github');

    try {
      await signIn(page);
      await page.goto(url(ROUTES.settings.connectedAccounts));

      const main = page.getByRole('main');

      await expect(main).toBeVisible({ timeout: 15_000 });

      const githubRow = main.locator('.rounded-lg.border').filter({
        has: page.locator('.lucide-github'),
      });

      const unlinkBtn = githubRow.locator('button').filter({
        has: page.locator('.lucide-unlink'),
      });

      await expect(unlinkBtn).toBeEnabled({ timeout: 5_000 });
      await unlinkBtn.click();

      const dialog = page.locator(sel.alertDialog);

      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.locator('button[data-variant="destructive"]').click();
      await waitForToast(page);
      await page.reload({ waitUntil: 'networkidle' });

      const githubRowAfter = page
        .getByRole('main')
        .locator('.rounded-lg.border')
        .filter({ has: page.locator('.lucide-github') });

      await expect(
        githubRowAfter.locator('button').filter({ has: page.locator('.lucide-unlink') })
      ).not.toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteUserByEmail(email).catch(() => {});
    }
  });

  test('unlink button disabled when only one login method remains', async ({ page }, testInfo) => {
    const email = scopedEmail('e2e-single-method', testInfo.project.name);
    const signIn = makeApiSignIn(email, E2E_PASSWORD);

    await ensureUser(email, E2E_PASSWORD);

    try {
      await signIn(page);
      await page.goto(url(ROUTES.settings.connectedAccounts));

      const main = page.getByRole('main');

      await expect(main).toBeVisible({ timeout: 15_000 });

      const rows = main.locator('.rounded-lg.border');

      await expect(rows).toHaveCount(3, { timeout: 10_000 });

      await expect(
        main.locator('button').filter({ has: page.locator('.lucide-unlink') })
      ).not.toBeVisible();

      await expect(
        main.locator('button').filter({ has: page.locator('.lucide-link') })
      ).toHaveCount(2, { timeout: 5_000 });
    } finally {
      await deleteUserByEmail(email).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// Account Merge — DB Level
// ---------------------------------------------------------------------------

test.describe('Account Merge — DB Level', () => {
  test('merge_user_data transfers projects from source to target', async ({}, testInfo) => {
    const admin = getAdminClient();
    const emailA = scopedEmail('e2e-merge-src', testInfo.project.name);
    const emailB = scopedEmail('e2e-merge-tgt', testInfo.project.name);

    const userIdA = await ensureUser(emailA, E2E_PASSWORD);
    const projectId = await createProjectViaDb(userIdA, 'Merge Test Project');
    const userIdB = await ensureUser(emailB, E2E_PASSWORD);

    try {
      const { error } = await admin.rpc('merge_user_data', {
        from_user_id: userIdA,
        to_user_id: userIdB,
      });

      expect(error).toBeNull();

      const { data: project } = await admin
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      expect(project?.user_id).toBe(userIdB);

      const { data: profileA } = await admin
        .from('profiles')
        .select('id')
        .eq('id', userIdA)
        .single();

      expect(profileA).toBeNull();
    } finally {
      await deleteUserByEmail(emailA).catch(() => {});
      await deleteUserByEmail(emailB).catch(() => {});
    }
  });

  test('merge_user_data handles project name conflicts', async ({}, testInfo) => {
    const admin = getAdminClient();
    const emailA = scopedEmail('e2e-merge-dup-src', testInfo.project.name);
    const emailB = scopedEmail('e2e-merge-dup-tgt', testInfo.project.name);
    const userIdA = await ensureUser(emailA, E2E_PASSWORD);

    await createProjectViaDb(userIdA, 'Same Name');

    const userIdB = await ensureUser(emailB, E2E_PASSWORD);

    await createProjectViaDb(userIdB, 'Same Name');

    try {
      const { error } = await admin.rpc('merge_user_data', {
        from_user_id: userIdA,
        to_user_id: userIdB,
      });

      expect(error).toBeNull();

      const { data: projects } = await admin
        .from('projects')
        .select('name')
        .eq('user_id', userIdB)
        .order('name');

      expect(projects).toHaveLength(2);
      expect(projects?.some((p) => p.name === 'Same Name')).toBe(true);
      expect(projects?.some((p) => p.name === 'Same Name (merged)')).toBe(true);
    } finally {
      await deleteUserByEmail(emailA).catch(() => {});
      await deleteUserByEmail(emailB).catch(() => {});
    }
  });

  test('merge_user_data fills empty target profile fields from source', async ({}, testInfo) => {
    const admin = getAdminClient();
    const emailA = scopedEmail('e2e-merge-prof-src', testInfo.project.name);
    const emailB = scopedEmail('e2e-merge-prof-tgt', testInfo.project.name);

    const userIdA = await ensureUser(emailA, E2E_PASSWORD, {
      fullName: 'Source User',
      role: 'researcher',
    });

    const userIdB = await ensureUser(emailB, E2E_PASSWORD, { fullName: '', role: '' });

    try {
      const { error } = await admin.rpc('merge_user_data', {
        from_user_id: userIdA,
        to_user_id: userIdB,
      });

      expect(error).toBeNull();

      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, role')
        .eq('id', userIdB)
        .single();

      expect(profile?.full_name).toBe('Source User');
      expect(profile?.role).toBe('researcher');
    } finally {
      await deleteUserByEmail(emailA).catch(() => {});
      await deleteUserByEmail(emailB).catch(() => {});
    }
  });
});
