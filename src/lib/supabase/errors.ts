/**
 * Maps known Supabase error messages to i18n translation keys.
 * Prevents leaking internal error details to the client.
 */
const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'auth.errors.invalidCredentials',
  'Email not confirmed': 'auth.errors.emailNotConfirmed',
  'User already registered': 'auth.errors.userAlreadyRegistered',
  'Password should be at least 8 characters': 'auth.errors.passwordTooShort',
  'New password should be different from the old password.': 'auth.errors.samePassword',
  'Email rate limit exceeded': 'auth.errors.rateLimitExceeded',
  'For security purposes, you can only request this after': 'auth.errors.rateLimitExceeded',
  'Unable to validate email address: invalid format': 'auth.errors.invalidEmail',
  'Signups not allowed for this instance': 'auth.errors.signupsDisabled',
  'Email link is invalid or has expired': 'auth.errors.linkExpired',
  'Identity not found': 'settings.connectedAccounts.errors.identityNotFound',
  'User must have at least one identity': 'settings.connectedAccounts.errors.cannotUnlinkLast',
};

export function mapSupabaseError(supabaseMessage: string): string {
  const exactMatch = SUPABASE_ERROR_MAP[supabaseMessage];

  if (exactMatch) {
    return exactMatch;
  }

  for (const [pattern, key] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (supabaseMessage.startsWith(pattern)) {
      return key;
    }
  }

  return 'auth.errors.unexpected';
}
