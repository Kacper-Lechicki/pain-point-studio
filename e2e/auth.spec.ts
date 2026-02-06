import { expect, test } from '@playwright/test';

/**
 * Helper: targets the password <input> by its form field name.
 * `getByLabel('Password')` is ambiguous because the "Show password" toggle
 * button and the password-requirements list also match via aria-label.
 */
const passwordInput = (page: import('@playwright/test').Page, name = 'password') =>
  page.locator(`input[name="${name}"]`);

// ---------------------------------------------------------------------------
// Auth Pages – Navigation & Layout
// ---------------------------------------------------------------------------
test.describe('Auth Pages – Navigation & Layout', () => {
  test('sign-in page loads and displays all expected elements', async ({ page }) => {
    await page.goto('/en/sign-in');

    // Header
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/enter your email to sign in/i)).toBeVisible();

    // Form elements
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();

    // Password visibility toggle
    await expect(page.getByRole('button', { name: /show password/i })).toBeVisible();

    // OAuth section
    await expect(page.getByText(/or continue with/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();

    // Navigation links
    await expect(page.getByRole('link', { name: /don't have an account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();

    // Branding
    await expect(page.getByText('Pain Point Studio')).toBeVisible();
  });

  test('sign-up page loads and displays all expected elements', async ({ page }) => {
    await page.goto('/en/sign-up');

    // Header
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByText(/enter your email below to create/i)).toBeVisible();

    // Form elements
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /create an account/i })).toBeVisible();

    // Password strength indicator
    await expect(page.getByText(/password strength/i)).toBeVisible();

    // Password requirements list
    await expect(page.getByText('≥ 8 characters')).toBeVisible();
    await expect(page.getByText('≥ 1 uppercase letter')).toBeVisible();
    await expect(page.getByText('≥ 1 lowercase letter')).toBeVisible();
    await expect(page.getByText('≥ 1 number')).toBeVisible();
    await expect(page.getByText('≥ 1 special character')).toBeVisible();

    // OAuth section
    await expect(page.getByText(/or continue with/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();

    // Terms text
    await expect(page.getByText(/by continuing, you agree to our/i)).toBeVisible();
    await expect(page.getByText(/terms of service/i)).toBeVisible();
    await expect(page.getByText(/privacy policy/i)).toBeVisible();

    // Navigation links
    await expect(page.getByRole('link', { name: /already have an account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('forgot-password page loads and displays all expected elements', async ({ page }) => {
    await page.goto('/en/forgot-password');

    // Header
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    await expect(
      page.getByText(/enter your email to receive a password reset link/i)
    ).toBeVisible();

    // Form elements
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();

    // No OAuth section on forgot-password
    await expect(page.getByText(/or continue with/i)).not.toBeVisible();

    // Navigation links
    await expect(page.getByRole('link', { name: /back to sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('update-password page loads and displays all expected elements', async ({ page }) => {
    await page.goto('/en/update-password');

    // Header
    await expect(page.getByRole('heading', { name: /set new password/i })).toBeVisible();
    await expect(page.getByText(/please enter your new password below/i)).toBeVisible();

    // Form elements
    await expect(page.getByLabel('New Password')).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();

    // Password strength indicator on new password field
    await expect(page.getByText(/password strength/i)).toBeVisible();

    // Password visibility toggles (2: one for each field)
    const toggles = page.getByRole('button', { name: /show password/i });
    await expect(toggles).toHaveCount(2);

    // Navigation link
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();
  });

  test('back to home link navigates to landing page', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /back to home/i }).click({ force: true });
    await expect(page).toHaveURL(/\/en$/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Auth Pages – Cross-Navigation
// ---------------------------------------------------------------------------
test.describe('Auth Pages – Cross-Navigation', () => {
  test('sign-in page links to sign-up', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /don't have an account/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-up/, { timeout: 10_000 });
  });

  test('sign-up page links to sign-in via "Already have an account?"', async ({ page }) => {
    await page.goto('/en/sign-up', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /already have an account/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/, { timeout: 10_000 });
  });

  test('sign-in page links to forgot-password', async ({ page }) => {
    await page.goto('/en/sign-in', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /forgot your password/i }).click();
    await expect(page).toHaveURL(/\/en\/forgot-password/, { timeout: 10_000 });
  });

  test('forgot-password page links back to sign-in', async ({ page }) => {
    await page.goto('/en/forgot-password', { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/sign-in/, { timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Auth Forms – Validation (Sign In)
// ---------------------------------------------------------------------------
test.describe('Auth Forms – Sign In Validation', () => {
  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('not-an-email');
    await passwordInput(page).fill('SomePassword1!');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    await expect(page.locator('form')).toBeVisible();
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('rejects empty password', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('rejects completely empty form', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('shows error toast for wrong credentials', async ({ page }) => {
    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await passwordInput(page).fill('WrongPassword1!');
    await page.getByRole('button', { name: /sign in with email/i }).click();

    // Should show an error toast (Supabase returns "Invalid login credentials")
    await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible({
      timeout: 20_000,
    });

    // Should remain on sign-in page
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });
});

// ---------------------------------------------------------------------------
// Auth Forms – Validation (Sign Up)
// ---------------------------------------------------------------------------
test.describe('Auth Forms – Sign Up Validation', () => {
  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('bad');
    await passwordInput(page).fill('StrongPass1!');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test('rejects password without uppercase letter', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('test@example.com');
    await passwordInput(page).fill('weakpass1!');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test('rejects password without special character', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('test@example.com');
    await passwordInput(page).fill('WeakPass12');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test('rejects password without number', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('test@example.com');
    await passwordInput(page).fill('WeakPass!!');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test('rejects password shorter than 8 characters', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('test@example.com');
    await passwordInput(page).fill('Ab1!');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });

  test('rejects empty form submission', async ({ page }) => {
    await page.goto('/en/sign-up');
    await page.getByRole('button', { name: /create an account/i }).click();

    await expect(page).toHaveURL(/\/en\/sign-up/);
  });
});

// ---------------------------------------------------------------------------
// Auth Forms – Validation (Forgot Password)
// ---------------------------------------------------------------------------
test.describe('Auth Forms – Forgot Password Validation', () => {
  test('rejects empty email submission', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page).toHaveURL(/\/en\/forgot-password/);
  });

  test('rejects invalid email format', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await page.getByLabel('Email').fill('not-valid');
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page).toHaveURL(/\/en\/forgot-password/);
  });
});

// ---------------------------------------------------------------------------
// Auth Forms – Validation (Update Password)
// ---------------------------------------------------------------------------
test.describe('Auth Forms – Update Password Validation', () => {
  test('rejects empty form submission', async ({ page }) => {
    await page.goto('/en/update-password');
    await page.getByRole('button', { name: /update password/i }).click();

    await expect(page).toHaveURL(/\/en\/update-password/);
  });

  test('rejects password without meeting all requirements', async ({ page }) => {
    await page.goto('/en/update-password');
    await passwordInput(page).fill('weak');
    await passwordInput(page, 'confirmPassword').fill('weak');
    await page.getByRole('button', { name: /update password/i }).click();

    await expect(page).toHaveURL(/\/en\/update-password/);
  });

  test('rejects mismatched passwords', async ({ page }) => {
    await page.goto('/en/update-password');
    await passwordInput(page).fill('StrongPass1!');
    await passwordInput(page, 'confirmPassword').fill('DifferentPass1!');
    await page.getByRole('button', { name: /update password/i }).click();

    // Should show "Passwords don't match" error message
    await expect(page.getByText(/passwords don't match/i)).toBeVisible();
    await expect(page).toHaveURL(/\/en\/update-password/);
  });
});

// ---------------------------------------------------------------------------
// Auth – Password Input Interactions
// ---------------------------------------------------------------------------
test.describe('Auth – Password Input Interactions', () => {
  test('sign-in password visibility toggle works', async ({ page }) => {
    await page.goto('/en/sign-in');

    const pwInput = passwordInput(page);
    const toggleButton = page.getByRole('button', { name: /show password/i });

    // Initially password is hidden
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Click to show
    await toggleButton.click();
    await expect(pwInput).toHaveAttribute('type', 'text');

    // Button label should change
    await expect(page.getByRole('button', { name: /hide password/i })).toBeVisible();

    // Click to hide again
    await page.getByRole('button', { name: /hide password/i }).click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('sign-up password strength indicator updates dynamically', async ({ page }) => {
    await page.goto('/en/sign-up');

    const pwInput = passwordInput(page);

    // Initially shows "Too weak"
    await expect(page.getByText(/too weak/i)).toBeVisible();

    // Type a short lowercase-only password
    await pwInput.fill('ab');
    await expect(page.getByText(/too weak/i)).toBeVisible();

    // Type a password meeting all requirements
    await pwInput.fill('StrongPass1!');
    await expect(page.getByText(/too weak/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – Route Protection
// ---------------------------------------------------------------------------
test.describe('Auth – Route Protection', () => {
  test('unauthenticated user is redirected from /dashboard to /sign-in', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('unauthenticated user is redirected from /settings to /sign-in', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('unauthenticated user can access sign-in page', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page).toHaveURL(/\/en\/sign-in/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('unauthenticated user can access sign-up page', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page).toHaveURL(/\/en\/sign-up/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('unauthenticated user can access forgot-password page', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page).toHaveURL(/\/en\/forgot-password/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('unauthenticated user can access update-password page', async ({ page }) => {
    await page.goto('/en/update-password');
    await expect(page).toHaveURL(/\/en\/update-password/);
    await expect(page.getByLabel('New Password')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – OAuth Buttons
// ---------------------------------------------------------------------------
test.describe('Auth – OAuth Buttons', () => {
  test('sign-in page shows GitHub and Google OAuth buttons', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('sign-up page shows GitHub and Google OAuth buttons', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('forgot-password page does NOT show OAuth buttons', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByRole('button', { name: /github/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).not.toBeVisible();
  });

  test('update-password page does NOT show OAuth buttons', async ({ page }) => {
    await page.goto('/en/update-password');
    await expect(page.getByRole('button', { name: /github/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – Page Headers & Content
// ---------------------------------------------------------------------------
test.describe('Auth – Page Headers & Content', () => {
  test('sign-in page has correct heading hierarchy', async ({ page }) => {
    await page.goto('/en/sign-in');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/welcome back/i);
  });

  test('sign-up page has correct heading hierarchy', async ({ page }) => {
    await page.goto('/en/sign-up');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/create an account/i);
  });

  test('forgot-password page has correct heading hierarchy', async ({ page }) => {
    await page.goto('/en/forgot-password');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/reset password/i);
  });

  test('update-password page has correct heading hierarchy', async ({ page }) => {
    await page.goto('/en/update-password');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText(/set new password/i);
  });

  test('sign-up page shows terms and privacy text', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page.getByText(/by continuing, you agree to our/i)).toBeVisible();
    await expect(page.getByText(/terms of service/i)).toBeVisible();
    await expect(page.getByText(/privacy policy/i)).toBeVisible();
  });

  test('forgot-password page does NOT show terms text', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByText(/by continuing, you agree to our/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – Form Submit Button States
// ---------------------------------------------------------------------------
test.describe('Auth – Form Submit Button States', () => {
  test('sign-in submit button is enabled initially', async ({ page }) => {
    await page.goto('/en/sign-in');
    await expect(page.getByRole('button', { name: /sign in with email/i })).toBeEnabled();
  });

  test('sign-up submit button is enabled initially', async ({ page }) => {
    await page.goto('/en/sign-up');
    await expect(page.getByRole('button', { name: /create an account/i })).toBeEnabled();
  });

  test('forgot-password submit button is enabled initially', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeEnabled();
  });

  test('update-password submit button is enabled initially', async ({ page }) => {
    await page.goto('/en/update-password');
    await expect(page.getByRole('button', { name: /update password/i })).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Auth – Toast on Dashboard (via query param)
// ---------------------------------------------------------------------------
test.describe('Auth – Toast via Query Param', () => {
  test('dashboard with ?toast param redirects unauthenticated to sign-in', async ({ page }) => {
    await page.goto('/en/dashboard?toast=signInSuccess');
    await expect(page).toHaveURL(/\/en\/sign-in/);
  });

  test('invalid toast param is ignored (no crash)', async ({ page }) => {
    await page.goto('/en/sign-in?toast=invalidKey');

    // Page should load normally
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – Callback Error Handling
// ---------------------------------------------------------------------------
test.describe('Auth – Callback Error Handling', () => {
  test('callback without code redirects to sign-in with error param', async ({ page }) => {
    await page.goto('/en/auth/callback');
    await expect(page).toHaveURL(/\/en\/sign-in\?error=auth_callback_error/);
  });

  test('callback with invalid code redirects to sign-in with error param', async ({ page }) => {
    await page.goto('/en/auth/callback?code=invalid-code');
    await expect(page).toHaveURL(/\/en\/sign-in\?error=auth_callback_error/);
  });
});

// ---------------------------------------------------------------------------
// Auth – Responsive Layout
// ---------------------------------------------------------------------------
test.describe('Auth – Responsive Layout', () => {
  test('auth pages render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/en/sign-in');

    // Core elements should still be visible
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth – Keyboard Accessibility
// ---------------------------------------------------------------------------
test.describe('Auth – Keyboard Accessibility', () => {
  test('sign-in form can be submitted with Enter key', async ({ page, isMobile, browserName }) => {
    test.skip(isMobile, 'Keyboard submission is not applicable on mobile viewports');
    test.skip(
      browserName === 'webkit',
      'WebKit does not reliably trigger form submit via programmatic Enter'
    );

    await page.goto('/en/sign-in');
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await passwordInput(page).fill('SomePass1!');
    await passwordInput(page).press('Enter');

    // Form should submit (we expect an error toast since credentials are invalid)
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 15_000 });
  });

  test('sign-up form can be submitted with Enter key', async ({ page, isMobile, browserName }) => {
    test.skip(isMobile, 'Keyboard submission is not applicable on mobile viewports');
    test.skip(
      browserName === 'webkit',
      'WebKit does not reliably trigger form submit via programmatic Enter'
    );

    await page.goto('/en/sign-up');
    await page.getByLabel('Email').fill('e2e-enter-test@example.com');
    await passwordInput(page).fill('StrongPass1!');
    await passwordInput(page).press('Enter');

    // Form should submit — either:
    // 1. success state heading appears ("Check your email"), or
    // 2. a toast appears (success or Supabase error), or
    // 3. the submit button shows a loading spinner (disabled state)
    await expect(
      page
        .getByRole('heading', { name: /check your email/i })
        .or(page.locator('[data-sonner-toast]'))
        .or(page.locator('button:disabled', { hasText: /create an account/i }))
    ).toBeVisible({ timeout: 15_000 });
  });
});
