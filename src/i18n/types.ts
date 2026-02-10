import type en from './messages/en.json';

type Messages = typeof en;

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}

export type MessageKey = NestedKeyOf<Messages>;

type NestedKeyOf<T, Prefix extends string = ''> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? NestedKeyOf<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`;
      }[keyof T & string]
    : never;
