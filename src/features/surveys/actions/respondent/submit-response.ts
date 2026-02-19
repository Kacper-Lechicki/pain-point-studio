'use server';

import { mapRpcError } from '@/features/surveys/config';
import { submitResponseSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

export const submitResponse = withPublicAction<typeof submitResponseSchema, void>(
  'submit-response',
  {
    schema: submitResponseSchema,
    rateLimit: RATE_LIMITS.respondentSubmit,
    action: async ({ data, db }) => {
      const { error } = await db.rpc('submit_survey_response', {
        p_response_id: data.responseId,
        ...(data.contactName ? { p_contact_name: data.contactName } : {}),
        ...(data.contactEmail ? { p_contact_email: data.contactEmail } : {}),
        ...(data.feedback ? { p_feedback: data.feedback } : {}),
      });

      if (error) {
        return { error: `respondent.${mapRpcError(error.message, 'errors.submitFailed')}` };
      }

      return { success: true };
    },
  }
);
