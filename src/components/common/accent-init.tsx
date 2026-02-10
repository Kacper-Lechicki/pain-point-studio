'use client';

import { useEffect } from 'react';

import { ACCENT_OPTIONS, DEFAULT_ACCENT } from '@/hooks/common/use-accent';

const STORAGE_KEY = 'accent';
const ATTRIBUTE = 'data-accent';

const AccentInit = () => {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      const accent = ACCENT_OPTIONS.includes(stored as (typeof ACCENT_OPTIONS)[number])
        ? stored!
        : DEFAULT_ACCENT;

      document.documentElement.setAttribute(ATTRIBUTE, accent);
    } catch {
      document.documentElement.setAttribute(ATTRIBUTE, DEFAULT_ACCENT);
    }
  }, []);

  return null;
};

export { AccentInit };
