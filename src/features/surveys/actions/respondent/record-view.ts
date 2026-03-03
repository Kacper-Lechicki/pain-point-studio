'use server';

import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { createClient } from '@/lib/supabase/server';

/**
 * Fire-and-forget server action that increments the view_count for a survey.
 * Called from the respondent landing page on every page load.
 * The DB RPC only increments for active surveys — no client-side guard needed.
 */
export async function recordView(surveyId: string): Promise<void> {
  const { limited } = await rateLimit({ key: 'record-view', ...RATE_LIMITS.respondentView });

  if (limited) {
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('record_survey_view', { p_survey_id: surveyId });

  if (error) {
    // eslint-disable-next-line no-console -- intentional server-side error logging
    console.error('[recordView] Failed to record survey view:', error.message);
  }
}
