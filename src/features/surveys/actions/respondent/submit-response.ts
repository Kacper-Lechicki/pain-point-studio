'use server';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';

import { mapRpcError } from '../../config';
import { submitResponseSchema } from '../../types';

export const submitResponse = withPublicAction<typeof submitResponseSchema, void>(
  'submit-response',
  {
    schema: submitResponseSchema,
    rateLimit: RATE_LIMITS.respondentSubmit,
    action: async ({ data, supabase }) => {
      const { error } = await supabase.rpc('submit_survey_response', {
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
