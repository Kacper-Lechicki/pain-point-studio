/**
 * Type-safe i18n keys: augments next-intl so useTranslations/getTranslations
 * accept only valid message keys. MessageKey is derived from en.json structure
 * (dot-notation, e.g. 'auth.signInSuccess'). Other locales must match that structure.
 */
import type en from './messages/en.json';

type Messages = typeof en;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}

export type MessageKey = NestedKeyOf<Messages>;

/** Recursively builds dot-notation keys from a nested message object. */
type NestedKeyOf<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? NestedKeyOf<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`;
      }[keyof T & string]
    : never;
