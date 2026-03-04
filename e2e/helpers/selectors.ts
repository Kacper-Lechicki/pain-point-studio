/** Shared selectors reused across e2e spec files. */
export const sel = {
  toast: '[data-sonner-toast]',
  alertDialog: '[role="alertdialog"]',
  dialog: '[role="dialog"]',
  submit: 'form button[type="submit"]',
  nameInput: 'input[name="name"]',
  summaryInput: 'textarea[name="summary"]',
} as const;

/** Default password for all e2e test users. */
export const E2E_PASSWORD = 'E2eTestPass1!';
