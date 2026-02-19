'use client';

import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { REALTIME_DEBOUNCE_MS } from '@/features/surveys/config';
import { createBrowserRealtimeProvider } from '@/lib/providers/client';

/**
 * Subscribes to Realtime changes on both `survey_responses` and
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

    const realtime = createBrowserRealtimeProvider();

    const debouncedRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        routerRef.current.refresh();
        onSyncRef.current?.();
      }, REALTIME_DEBOUNCE_MS);
    };

    const channel = realtime.subscribe(
      'dashboard-survey-list',
      [
        {
          event: '*',
          table: 'survey_responses',
        },
        {
          event: 'UPDATE',
          table: 'surveys',
        },
      ],
      debouncedRefresh,
      (status) => {
        setIsConnected(status === 'SUBSCRIBED');
      }
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      channel.unsubscribe();
    };
  }, [enabled]);

  return { isConnected: enabled ? isConnected : false };
}
