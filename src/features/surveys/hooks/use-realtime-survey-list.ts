'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { REALTIME_DEBOUNCE_MS } from '@/features/surveys/config';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Supabase Realtime changes on both `survey_responses` and
 * `surveys` tables. On any change, triggers a debounced `router.refresh()`
 * which re-runs the server component and passes fresh `initialSurveys`.
 *
 * Used on the dashboard list page so response counts, activity, and status
 * changes (including auto-complete) are reflected without a manual reload.
 *
 * Returns `isConnected` — true when the channel is in the SUBSCRIBED state.
 */
export function useRealtimeSurveyList(onSync?: () => void, enabled = true) {
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

    const channel = supabase
      .channel('dashboard-survey-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_responses',
        },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'surveys',
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
  }, [enabled]);

  return { isConnected: enabled ? isConnected : false };
}
