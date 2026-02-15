// Theme accent (data-accent on <html>). useSyncExternalStore: getServerSnapshot = default, getSnapshot = localStorage — no hydration mismatch.
'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

// Theme accent (data-accent on <html>). useSyncExternalStore: getServerSnapshot = default, getSnapshot = localStorage — no hydration mismatch.

// Theme accent (data-accent on <html>). useSyncExternalStore: getServerSnapshot = default, getSnapshot = localStorage — no hydration mismatch.

// Theme accent (data-accent on <html>). useSyncExternalStore: getServerSnapshot = default, getSnapshot = localStorage — no hydration mismatch.

const ACCENT_STORAGE_KEY = 'accent';
const ACCENT_ATTRIBUTE = 'data-accent';

export const ACCENT_OPTIONS = ['blue', 'teal', 'indigo'] as const;
export type Accent = (typeof ACCENT_OPTIONS)[number];
export const DEFAULT_ACCENT: Accent = 'blue';

function getStoredAccent(): Accent {
  if (typeof window === 'undefined') {
    return DEFAULT_ACCENT;
  }

  const stored = localStorage.getItem(ACCENT_STORAGE_KEY);

  if (stored === null) {
    return DEFAULT_ACCENT;
  }

  return ACCENT_OPTIONS.includes(stored as Accent) ? (stored as Accent) : DEFAULT_ACCENT;
}

function subscribeToAccent(): () => void {
  return () => {};
}

export function useAccent() {
  const accent = useSyncExternalStore(subscribeToAccent, getStoredAccent, () => DEFAULT_ACCENT);

  const [, setTick] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute(ACCENT_ATTRIBUTE, accent);
  }, [accent]);

  const setAccent = useCallback((newAccent: Accent) => {
    localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
    setTick((t) => t + 1);
  }, []);

  return { accent, setAccent } as const;
}
