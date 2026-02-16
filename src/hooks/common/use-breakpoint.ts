'use client';

import { useSyncExternalStore } from 'react';

import { BREAKPOINTS, type Breakpoint } from '@/config';

function getSnapshot(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(breakpoint: Breakpoint, onStoreChange: () => void): () => void {
  window.addEventListener('resize', onStoreChange);

  return () => window.removeEventListener('resize', onStoreChange);
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(breakpoint, onStoreChange),
    () => getSnapshot(breakpoint),
    getServerSnapshot
  );
}
