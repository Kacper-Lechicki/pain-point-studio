// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.
'use client';

import { useSyncExternalStore } from 'react';

import { BREAKPOINTS, type Breakpoint } from '@/config';

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

// Returns true when viewport is >= breakpoint. useSyncExternalStore + resize so no setState in effect; getServerSnapshot = false for SSR.

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
