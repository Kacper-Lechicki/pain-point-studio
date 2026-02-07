import { expect, test } from '@playwright/test';

test('homepage should load', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
});
