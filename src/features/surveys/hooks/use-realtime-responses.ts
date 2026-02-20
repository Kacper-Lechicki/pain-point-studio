'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { REALTIME_STATS_DEBOUNCE_MS } from '@/features/surveys/config';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Realtime changes on `survey_responses` and `surveys`
 * for a given survey. On any INSERT/UPDATE/DELETE, triggers `router.refresh()`
 * (debounced at 1 s) so the server component re-fetches the cached stats RPC.
 *
 * Listening to both tables ensures:
 * - New/updated responses update stats in real time
 * - Survey status changes (e.g. auto-complete when cap is reached) are picked up
 *
 * Returns `isConnected` — true when the channel is in the SUBSCRIBED state.
 */
export function useRealtimeResponses(surveyId: string, onSync?: () => void, enabled = true) {
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
      }, REALTIME_STATS_DEBOUNCE_MS);
    };

    let channel = supabase.channel(`survey-stats:${surveyId}`);

    channel = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_responses',
          filter: `survey_id=eq.${surveyId}`,
        },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'surveys', filter: `id=eq.${surveyId}` },
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
  }, [surveyId, enabled]);

  return { isConnected: enabled ? isConnected : false };
}
