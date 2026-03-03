'use server';

import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { createClient } from '@/lib/supabase/server';

/**
 * Lightweight status check for respondent polling.
 * Returns the survey's current status string, or null on error/rate-limit.
 */
export async function checkSurveyStatus(surveyId: string): Promise<string | null> {
  const { limited } = await rateLimit({
    key: 'check-survey-status',
    ...RATE_LIMITS.respondentRead,
  });

  if (limited) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.from('surveys').select('status').eq('id', surveyId).single();

  return data?.status ?? null;
}
