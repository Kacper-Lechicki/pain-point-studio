'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { REALTIME_DEBOUNCE_MS } from '@/config/realtime';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Realtime changes relevant to a project:
 * - `survey_responses` (any event) — new/updated responses
 * - `surveys` (UPDATE) — status changes, auto-completion
 *
 * On any change, triggers a debounced `router.refresh()` which re-runs
 * the server component and passes fresh data to all tabs (overview stats,
 * surveys, etc.).
 *
 * Returns `isConnected` — true when the channel is in the SUBSCRIBED state.
 */
export function useRealtimeProject(onSync?: () => void, enabled = true) {
  const router = useRouter();
  const routerRef = useRef(router);
  const onSyncRef = useRef(onSync);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supabase = createClient();

    const debouncedRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        routerRef.current.refresh();
        onSyncRef.current?.();
      }, REALTIME_DEBOUNCE_MS);
    };

    let channel = supabase.channel('project-detail');

    channel = channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'survey_responses' },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'surveys' },
        debouncedRefresh
      );

    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [enabled]);

  return { isConnected: enabled ? isConnected : false };
}
