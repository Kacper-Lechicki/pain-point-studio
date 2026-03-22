import { expect, test } from '../fixtures';
import { fillField, waitForToast } from '../helpers/actions';
import { makeApiSignIn, scopedEmail } from '../helpers/auth';
import { setPendingEmailChange } from '../helpers/db-factories';
import { ROUTES, url } from '../helpers/routes';
import { E2E_PASSWORD, sel } from '../helpers/selectors';
import { deleteUserByEmail, ensureUser } from '../helpers/supabase-admin';

test('profile update and settings navigation', async ({ page, authenticatedPage: { email } }) => {
  await page.goto(url(ROUTES.settings.profile), { waitUntil: 'networkidle' });

  const main = page.getByRole('main');

  await expect(main.locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
  await fillField(main.locator(sel.fullName), 'Test User');
  await main.locator(sel.profileSubmit).click();
  await waitForToast(page);
  await page.goto(url(ROUTES.settings.email));
  await expect(page.locator(sel.emailInput)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(sel.emailInput)).toHaveValue(email);
  await page.goto(url(ROUTES.settings.password));
  await expect(page.locator(sel.passwordInput)).toBeVisible({ timeout: 15_000 });
  await page.goBack();
  await expect(page).toHaveURL(/\/settings\/email/, { timeout: 10_000 });
  await page.goto(url(ROUTES.common.settings));
  await expect(main.locator(sel.fullName)).toBeVisible({ timeout: 15_000 });
});

test('update password successfully', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.settings.password), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.passwordInput)).toBeVisible({ timeout: 15_000 });

  const newPassword = 'NewE2ePass1!';

  await fillField(page.locator(sel.currentPassword), E2E_PASSWORD);
  await fillField(page.locator(sel.passwordInput), newPassword);
  await fillField(page.locator(sel.confirmPassword), newPassword);
  await page.locator(sel.passwordSubmit).click();
  await waitForToast(page);
  await expect(page).toHaveURL(/\/settings\/password/);
});

test('wrong current password shows error toast', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.settings.password), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.passwordInput)).toBeVisible({ timeout: 15_000 });

  await fillField(page.locator(sel.currentPassword), 'WrongPassword1!');
  await fillField(page.locator(sel.passwordInput), 'NewE2ePass1!');
  await fillField(page.locator(sel.confirmPassword), 'NewE2ePass1!');
  await page.locator(sel.passwordSubmit).click();
  await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/settings\/password/);
});

test('update bio in profile settings', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.settings.profile), { waitUntil: 'networkidle' });

  const main = page.getByRole('main');

  await expect(main.locator(sel.bio)).toBeVisible({ timeout: 15_000 });
  await fillField(main.locator(sel.bio), 'E2E bio content for testing.');
  await main.locator(sel.profileSubmit).click();
  await waitForToast(page);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(main.locator(sel.bio)).toHaveValue('E2E bio content for testing.', {
    timeout: 15_000,
  });
});

test('email change submits and shows confirmation', async ({
  page,
  authenticatedPage: { email },
}) => {
  await page.goto(url(ROUTES.settings.email), { waitUntil: 'networkidle' });
  await expect(page.locator(sel.emailInput)).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(sel.emailInput)).toHaveValue(email);
  await fillField(page.locator(sel.emailInput), 'newemail-e2e@example.com');
  await page.locator(sel.submit).click();
  await waitForToast(page);
});

test('cancel pending email change', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-cancel-email', testInfo.project.name);
  const signIn = makeApiSignIn(email, E2E_PASSWORD);

  await ensureUser(email, E2E_PASSWORD);

  try {
    await setPendingEmailChange(email, E2E_PASSWORD, 'cancel-test-e2e@example.com');

    await signIn(page);
    await page.goto(url(ROUTES.settings.email), { waitUntil: 'networkidle' });

    await expect(page.getByRole('button', { name: 'Cancel Change' })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: 'Cancel Change' }).click();

    await expect(page.getByRole('button', { name: 'Cancel Change' })).not.toBeVisible({
      timeout: 15_000,
    });
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('connected accounts page renders', async ({ page, authenticatedPage: {} }) => {
  await page.goto(url(ROUTES.settings.connectedAccounts));
  await expect(page.getByRole('main')).toBeVisible({ timeout: 15_000 });
});

test('delete account: dialog -> cancel -> confirm -> locked', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-settings-delete', testInfo.project.name);
  const signIn = makeApiSignIn(email, E2E_PASSWORD);

  await ensureUser(email, E2E_PASSWORD);

  try {
    await signIn(page);
    await page.goto(url(ROUTES.settings.dangerZone), { waitUntil: 'networkidle' });
    await expect(page.locator(sel.deleteButton)).toBeVisible({ timeout: 15_000 });
    await page.locator(sel.deleteButton).click();

    const dialog = page.locator(sel.dialog);

    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.locator('button[type="submit"]')).toBeDisabled();
    await dialog.locator('[data-testid="delete-cancel"]').click();
    await expect(dialog).not.toBeVisible({ timeout: 10_000 });
    await page.locator(sel.deleteButton).click();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await fillField(dialog.locator(sel.confirmation), email);
    await expect(dialog.locator('button[type="submit"]')).toBeEnabled();
    await dialog.locator('button[type="submit"]').click();
    await waitForToast(page);

    await page.context().clearCookies();
    await page.goto(url(ROUTES.common.dashboard), { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 15_000 });
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});

test('complete profile modal: non-dismissable -> fill -> disappear', async ({ page }, testInfo) => {
  const email = scopedEmail('e2e-settings-modal', testInfo.project.name);

  await ensureUser(email, E2E_PASSWORD, { fullName: '', role: '' });

  const signIn = makeApiSignIn(email, E2E_PASSWORD);

  try {
    await signIn(page);

    const dialog = page.locator(sel.dialog);

    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await fillField(dialog.locator('input[name="fullName"]'), 'Test User');
    await dialog.locator('[data-testid="complete-profile-role"]').click();
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="option"]').first().click();
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).not.toBeVisible({ timeout: 15_000 });
  } finally {
    await deleteUserByEmail(email).catch(() => {});
  }
});
