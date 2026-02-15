'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

const DEBOUNCE_MS = 1000;

/**
 * Subscribes to Supabase Realtime changes on `survey_responses` and `surveys`
 * for a given survey. On any INSERT/UPDATE/DELETE, triggers `router.refresh()`
 * (debounced at 1 s) so the server component re-fetches the cached stats RPC.
 *
 * Listening to both tables ensures:
 * - New/updated responses update stats in real time
 * - Survey status changes (e.g. auto-complete when cap is reached) are picked up
 *
 * Returns `isConnected` — true when the channel is in the SUBSCRIBED state.
 */
export function useRealtimeResponses(surveyId: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const supabase = createClient();

    const debouncedRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        routerRef.current.refresh();
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`survey-stats:${surveyId}`)
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
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'surveys',
          filter: `id=eq.${surveyId}`,
        },
        debouncedRefresh
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [surveyId]);

  return { isConnected };
}
