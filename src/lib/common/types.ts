/**
 * Result shape for server actions and form handlers. Either success (with optional
 * data) or error (message key for i18n). Used by withProtectedAction, withPublicAction, useFormAction.
 */
export type ActionResult<T = undefined> =
  | { success: true; error?: undefined; data?: T }
  | { error: string; success?: undefined; data?: undefined };

/** An i18n lookup entry mapping a value to a translation key. */
export interface LookupItem {
  value: string;
  labelKey: string;
}
