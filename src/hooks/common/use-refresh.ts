'use client';

import { useRef, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

/**
 * Wraps `router.refresh()` with a pending state.
 * The returned `isRefreshing` flag can drive a spin animation on an icon.
 *
 * `lastSyncedAt` tracks when data was last refreshed — either via the
 * manual `refresh()` call or via an external trigger (call `markSynced()`).
 * Initialised to `Date.now()` (page load = fresh server data).
 */
export function useRefresh() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now);
  const lastSyncedAtRef = useRef(lastSyncedAt);

  const refresh = () => {
    startTransition(() => {
      router.refresh();

      const now = Date.now();

      lastSyncedAtRef.current = now;
      setLastSyncedAt(now);
    });
  };

  /** Call from realtime or any external sync to bump the timestamp. */
  const markSynced = () => {
    const now = Date.now();
    lastSyncedAtRef.current = now;
    setLastSyncedAt(now);
  };

  return { isRefreshing, refresh, lastSyncedAt, markSynced } as const;
}
