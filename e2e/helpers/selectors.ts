/** Shared selectors reused across e2e spec files. */
export const sel = {
  toast: '[data-sonner-toast]',
  alertDialog: '[role="alertdialog"]',
  submit: 'form button[type="submit"]',
} as const;

/** Default password for all e2e test users. */
export const E2E_PASSWORD = 'E2eTestPass1!';
