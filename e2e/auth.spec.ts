import { expect, test } from '@playwright/test';

test.describe('Auth Pages – Navigation & Layout', () => {
  // Verify that the sign-in page loads correctly and displays all necessary form elements
  test('sign-in page loads and displays form', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
    await expect(page.getByText('Pain Point Studio')).toBeVisible();
  });

  // Verify that the sign-up page loads correctly and displays all necessary form elements
  test('sign-up page loads and displays form', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create an account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  // Verify that the forgot-password page loads correctly and displays the form
  test('forgot-password page loads and displays form', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  // Verify that the 'Back to Home' link correctly navigates to the landing page
  test('back to home link navigates to landing page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL(/\/en$/);
  });
});

test.describe('Auth Pages – Cross-Navigation', () => {
  // Verify that the sign-in page contains a working link to the sign-up page
  test('sign-in page links to sign-up', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  // Verify that the sign-up page contains a working link to the sign-in page
  test('sign-up page links to sign-in', async ({ page }) => {
    await page.goto('/en/sign-up');

    await page
      .getByRole('link', { name: /sign in/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  // Verify that the sign-in page contains a working link to the forgot-password page
  test('sign-in page links to forgot-password', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByRole('link', { name: /forgot your password/i }).click();
    await expect(page).toHaveURL(/\/en\/forgot-password/);
  });

  // Verify that the forgot-password page contains a working link back to the sign-in page
  test('forgot-password page links back to sign-in', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await page.getByRole('link', { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});

test.describe('Auth Forms – Validation', () => {
  // Verify that the sign-in form shows an error or stays on page when an invalid email is entered
  test('sign-in rejects invalid email', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await expect(page.locator('form')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  // Verify that the sign-in form shows an error or stays on page when the password is too short
  test('sign-in rejects short password', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('short');
    await page.getByRole('button', { name: /sign in with email/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  // Verify that the sign-up form shows an error or stays on page when an invalid email is entered
  test('sign-up rejects invalid email', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('bad');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  // Verify that the forgot-password form handles empty email submission correctly
  test('forgot-password rejects empty email', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await page.getByRole('button', { name: /send reset link/i }).click();
    await expect(page).toHaveURL(/\/en\/forgot-password/);
  });
});

test.describe('Auth – Route Protection', () => {
  // Verify that unauthenticated users accessing /dashboard are redirected to sign-in
  test('unauthenticated user is redirected from /dashboard to /sign-in', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  // Verify that unauthenticated users accessing /settings are redirected to sign-in
  test('unauthenticated user is redirected from /settings to /sign-in', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  // Verify that the sign-in page is accessible to unauthenticated users
  test('unauthenticated user can access sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page).toHaveURL(/\/en\/sign-in/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  // Verify that the sign-up page is accessible to unauthenticated users
  test('unauthenticated user can access sign-up page', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page).toHaveURL(/\/en\/sign-up/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

test.describe('Auth – OAuth Buttons', () => {
  // Verify that GitHub and Google OAuth buttons are present on the sign-in page
  test('sign-in page shows GitHub and Google OAuth buttons', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  // Verify that GitHub and Google OAuth buttons are present on the sign-up page
  test('sign-up page shows GitHub and Google OAuth buttons', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});
