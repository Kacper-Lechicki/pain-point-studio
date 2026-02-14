'use server';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

import { mapRpcError } from '../../config';
import { startResponseSchema } from '../../types';

export const startResponse = withPublicAction<typeof startResponseSchema, { responseId: string }>(
  'start-response',
  {
    schema: startResponseSchema,
    rateLimit: RATE_LIMITS.respondentStart,
    action: async ({ data, supabase }) => {
      const { data: responseId, error } = await supabase.rpc('start_survey_response', {
        p_survey_id: data.surveyId,
      });

      if (error) {
        return { error: `respondent.${mapRpcError(error.message, 'errors.startFailed')}` };
      }

      return { success: true, data: { responseId: responseId as string } };
    },
  }
);
