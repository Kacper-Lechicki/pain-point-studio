'use server';

import { withPublicAction } from '@/lib/common/with-public-action';

import { RPC_ERROR } from '../../config';
import { startResponseSchema } from '../../types';

export const startResponse = withPublicAction<typeof startResponseSchema, { responseId: string }>(
  'start-response',
  {
    schema: startResponseSchema,
    rateLimit: { limit: 30, windowSeconds: 300 },
    action: async ({ data, supabase }) => {
      const { data: responseId, error } = await supabase.rpc('start_survey_response', {
        p_survey_id: data.surveyId,
      });

      if (error) {
        if (error.message.includes(RPC_ERROR.MAX_RESPONDENTS_REACHED)) {
          return { error: 'respondent.closed.maxReached' };
        }

        if (error.message.includes(RPC_ERROR.SURVEY_NOT_ACTIVE)) {
          return { error: 'respondent.closed.closed' };
        }

        return { error: 'respondent.errors.startFailed' };
      }

      return { success: true, data: { responseId: responseId as string } };
    },
  }
);
