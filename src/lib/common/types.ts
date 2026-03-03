import type { MessageKey } from '@/i18n/types';

/**
 * Result shape for server actions and form handlers. Either success (with optional
 * data) or error (message key for i18n). Used by withProtectedAction, withPublicAction, useFormAction.
 */
export type ActionResult<T = undefined> =
  | { success: true; error?: undefined; data?: T }
  | { error: string; success?: undefined; data?: T };

export interface LookupItem {
  value: string;
  labelKey: string;
}

/**
 * Common error keys shared across server actions. Typed as MessageKey to catch typos
 * at compile time. Feature-specific error keys should be defined in their own modules.
 */
export const ERRORS = {
  unexpected: 'common.errors.unexpected',
  rateLimitExceeded: 'common.errors.rateLimitExceeded',
  invalidData: 'common.errors.invalidData',
  authRequired: 'common.errors.authRequired',
} as const satisfies Record<string, MessageKey>;
