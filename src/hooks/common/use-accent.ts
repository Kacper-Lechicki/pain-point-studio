'use client';

import { useCallback, useEffect, useState } from 'react';

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

export function useAccent() {
  const [accent, setAccentState] = useState<Accent>(() => getStoredAccent());

  useEffect(() => {
    document.documentElement.setAttribute(ACCENT_ATTRIBUTE, accent);
  }, [accent]);

  const setAccent = useCallback((newAccent: Accent) => {
    setAccentState(newAccent);
    localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
  }, []);

  return { accent, setAccent } as const;
}
