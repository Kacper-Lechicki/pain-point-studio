'use server';

import { withPublicAction } from '@/lib/common/with-public-action';

import { startResponseSchema } from '../../types';

export const startResponse = withPublicAction<typeof startResponseSchema, { responseId: string }>(
  'start-response',
  {
    schema: startResponseSchema,
    rateLimit: { limit: 30, windowSeconds: 300 },
    action: async ({ data, supabase }) => {
      const { data: response, error } = await supabase
        .from('survey_responses')
        .insert({ survey_id: data.surveyId })
        .select('id')
        .single();

      if (error) {
        return { error: 'respondent.errors.startFailed' };
      }

      return { success: true, data: { responseId: response.id } };
    },
  }
);
