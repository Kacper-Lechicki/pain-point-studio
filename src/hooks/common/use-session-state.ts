'use client';

import { useCallback, useState } from 'react';

/**
 * Like `useState`, but persists the value in `sessionStorage`.
 * Falls back to in-memory state when sessionStorage is unavailable.
 *
 * @param key   Unique storage key (prefix with a page-level namespace to avoid collisions).
 * @param defaultValue  Value returned when nothing is stored yet.
 */
export function useSessionState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    if (typeof sessionStorage === 'undefined') {
      return defaultValue;
    }

    try {
      const stored = sessionStorage.getItem(key);

      if (stored === null) {
        return defaultValue;
      }

      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  });

  const setState = useCallback(
    (value: T) => {
      setStateRaw(value);

      try {
        if (typeof sessionStorage !== 'undefined') {
          const serialised = JSON.stringify(value);

          if (serialised === JSON.stringify(defaultValue)) {
            sessionStorage.removeItem(key);
          } else {
            sessionStorage.setItem(key, serialised);
          }
        }
      } catch {
        // Quota exceeded or unavailable — silently ignore
      }
    },
    // defaultValue is stable (literal from call site), key is stable string
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [state, setState];
}
