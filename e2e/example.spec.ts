import { expect, test } from '@playwright/test';

// Verify that the home page loads successfully with a 2xx status code
test('homepage should load', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
});
