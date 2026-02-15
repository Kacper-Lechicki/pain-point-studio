'use client';

import { useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

const DEBOUNCE_MS = 1000;

/**
 * Subscribes to Supabase Realtime changes on `survey_responses` for a given
 * survey. On any INSERT/UPDATE/DELETE, triggers `router.refresh()` (debounced
 * at 1 s) so the server component re-fetches the cached stats RPC.
 */
export function useRealtimeResponses(surveyId: string) {
  const router = useRouter();
  const routerRef = useRef(router);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`survey-responses:${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'survey_responses',
          filter: `survey_id=eq.${surveyId}`,
        },
        () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          timerRef.current = setTimeout(() => {
            routerRef.current.refresh();
          }, DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [surveyId]);
}
