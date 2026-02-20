'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Fire-and-forget server action that increments the view_count for a survey.
 * Called from the respondent landing page on every page load.
 * The DB RPC only increments for active surveys — no client-side guard needed.
 */
export async function recordView(surveyId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('record_survey_view', { p_survey_id: surveyId });
}
