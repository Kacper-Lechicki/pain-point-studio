import path from 'node:path';

import { expect, test } from '../fixtures';
import { ROUTES, url } from '../helpers/routes';

const TEST_IMAGE = path.resolve(__dirname, '../fixtures/test-image.png');

function projectUrl(projectId: string) {
  return url(`${ROUTES.dashboard.projects}/${projectId}`);
}

test('upload project image via crop dialog', async ({ page, testProject: { projectId } }) => {
  await page.goto(projectUrl(projectId));

  const avatarButton = page.getByRole('button', { name: 'Change image' });

  await expect(avatarButton).toBeVisible({ timeout: 15_000 });

  const fileInput = page.locator('input[type="file"]');

  await fileInput.setInputFiles(TEST_IMAGE);

  const dialog = page.locator('[role="dialog"]');

  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByText('Crop Image')).toBeVisible();

  await dialog.getByRole('button', { name: 'Apply' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(3_000);
  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
});

test('upload does not show error toast (regression)', async ({
  page,
  testProject: { projectId },
}) => {
  await page.goto(projectUrl(projectId));

  const fileInput = page.locator('input[type="file"]');

  await expect(page.getByRole('button', { name: 'Change image' })).toBeVisible({
    timeout: 15_000,
  });

  await fileInput.setInputFiles(TEST_IMAGE);

  const dialog = page.locator('[role="dialog"]');

  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole('button', { name: 'Apply' }).click();
  await expect(dialog).not.toBeVisible({ timeout: 15_000 });

  await expect(async () => {
    const img = page.locator('img[alt]').first();

    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');

    expect(src).toBeTruthy();
  }).toPass({ timeout: 10_000 });

  await expect(page.locator('[data-sonner-toast][data-type="error"]')).toHaveCount(0);
});
