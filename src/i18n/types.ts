import type en from './messages/en.json';

type Messages = typeof en;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}

/**
 * All valid top-level + nested i18n keys derived from en.json.
 * Use this type when a component receives a translation key as a prop
 * or when you need to pass a dynamic key to `t()`.
 */
export type MessageKey = NestedKeyOf<Messages>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively builds dot-separated key paths for a nested object. */
type NestedKeyOf<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? NestedKeyOf<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`;
      }[keyof T & string]
    : never;
