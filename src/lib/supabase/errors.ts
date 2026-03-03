/**
 * Maps Supabase Auth (GoTrue) and API error messages to i18n keys so the UI
 * can show localized, user-friendly messages. Unrecognized messages fall back
 * to auth.errors.unexpected.
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

  // Refresh token errors (expired sessions)
  'Token has expired or is invalid': 'auth.errors.linkExpired',
  'Invalid Refresh Token: Already Used': 'auth.errors.linkExpired',
  'Invalid Refresh Token: Refresh Token Not Found': 'auth.errors.linkExpired',

  // Weak password (Supabase password strength rules)
  'Password is too weak': 'auth.errors.passwordTooShort',

  // OAuth email missing or unverified
  'Unverified email': 'auth.errors.emailNotConfirmed',

  // Supabase API-level rate limit (distinct from GoTrue email rate limit)
  'Request rate limit reached': 'auth.errors.rateLimitExceeded',
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
