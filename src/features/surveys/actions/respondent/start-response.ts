'use server';

import { mapRpcError } from '@/features/surveys/config';
import { startResponseSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

export const startResponse = withPublicAction<typeof startResponseSchema, { responseId: string }>(
  'start-response',
  {
    schema: startResponseSchema,
    rateLimit: RATE_LIMITS.respondentStart,
    action: async ({ data, db }) => {
      const { data: responseId, error } = await db.rpc<string>('start_survey_response', {
        p_survey_id: data.surveyId,
        ...(data.deviceType ? { p_device_type: data.deviceType } : {}),
      });

      if (error) {
        return { error: `respondent.${mapRpcError(error.message, 'errors.startFailed')}` };
      }

      return { success: true, data: { responseId: responseId as string } };
    },
  }
);
