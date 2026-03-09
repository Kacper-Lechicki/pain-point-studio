'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const setSurveyInsightPreferenceSchema = z.object({
  surveyId: z.uuid(),
  generateInsights: z.boolean(),
});

/**
 * Sets whether a completed/cancelled survey should contribute
 * to the project's auto-generated insight suggestions.
 */
export const setSurveyInsightPreference = withProtectedAction<
  typeof setSurveyInsightPreferenceSchema,
  void
>('set-survey-insight-preference', {
  schema: setSurveyInsightPreferenceSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    const { data: row, error } = await supabase
      .from('surveys')
      .update({ generate_insights: data.generateInsights })
      .eq('id', data.surveyId)
      .eq('user_id', user.id)
      .in('status', ['completed', 'cancelled'])
      .select('id')
      .maybeSingle();

    if (error || !row) {
      return { error: 'surveys.errors.unexpected' };
    }

    return { success: true };
  },
});
