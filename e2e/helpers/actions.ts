import { type Locator, type Page, expect } from '@playwright/test';

import { sel } from './selectors';

export async function fillField(locator: Locator, value: string, timeout = 10_000) {
  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout });
}

export function listItem(page: Page, name: string) {
  return page.locator('tr, [role="list"] > *').filter({ hasText: name });
}

export async function executeMenuAction(
  page: Page,
  row: Locator,
  menuItemName: string,
  confirmButtonName?: string
) {
  await expect(row).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('Escape');

  await page
    .locator(`${sel.alertDialog}, [role="menu"]`)
    .first()
    .waitFor({ state: 'hidden', timeout: 3_000 })
    .catch(() => {});

  await row.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: menuItemName }).click();

  if (confirmButtonName) {
    const dialog = page.locator(sel.alertDialog);

    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await dialog.getByRole('button', { name: confirmButtonName }).click();
  }
}

export async function executeDetailAction(
  page: Page,
  menuItemName: string,
  confirmButtonName: string
) {
  await page.keyboard.press('Escape');

  await page
    .locator(`${sel.alertDialog}, [role="menu"]`)
    .first()
    .waitFor({ state: 'hidden', timeout: 3_000 })
    .catch(() => {});

  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('menuitem', { name: menuItemName }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 3_000 });
  await dialog.getByRole('button', { name: confirmButtonName }).click();
}

export async function executeBannerAction(
  page: Page,
  buttonName: string,
  confirmButtonName: string
) {
  await page.getByRole('button', { name: buttonName, exact: true }).click();

  const dialog = page.locator(sel.alertDialog);

  await expect(dialog).toBeVisible({ timeout: 3_000 });
  await dialog.getByRole('button', { name: confirmButtonName }).click();
}

export async function waitForToast(page: Page) {
  await expect(page.locator(sel.toast).first()).toBeVisible({ timeout: 10_000 });
}

export async function waitForToastCycle(page: Page) {
  await waitForToast(page);

  await page
    .locator(sel.toast)
    .first()
    .waitFor({ state: 'hidden', timeout: 10_000 })
    .catch(() => {});
}
