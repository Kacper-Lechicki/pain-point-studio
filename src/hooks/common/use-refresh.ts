'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Wraps `router.refresh()` with a pending state and a success toast.
 * The returned `isRefreshing` flag can drive a spin animation on an icon.
 *
 * `lastSyncedAt` tracks when data was last refreshed — either via the
 * manual `refresh()` call or via an external trigger (call `markSynced()`).
 * Initialised to `Date.now()` (page load = fresh server data).
 */
export function useRefresh() {
  const router = useRouter();
  const t = useTranslations();
  const [isRefreshing, startTransition] = useTransition();
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now);
  const lastSyncedAtRef = useRef(lastSyncedAt);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();

      const now = Date.now();

      lastSyncedAtRef.current = now;
      setLastSyncedAt(now);
      toast.success(t('common.dataRefreshed'));
    });
  }, [router, t]);

  /** Call from realtime or any external sync to bump the timestamp. */
  const markSynced = useCallback(() => {
    const now = Date.now();
    lastSyncedAtRef.current = now;
    setLastSyncedAt(now);
  }, []);

  return { isRefreshing, refresh, lastSyncedAt, markSynced } as const;
}
