'use server';

import { withPublicAction } from '@/lib/common/with-public-action';

import { RPC_ERROR } from '../../config';
import { submitResponseSchema } from '../../types';

export const submitResponse = withPublicAction<typeof submitResponseSchema, void>(
  'submit-response',
  {
    schema: submitResponseSchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, supabase }) => {
      const { error } = await supabase.rpc('submit_survey_response', {
        p_response_id: data.responseId,
        ...(data.contactName ? { p_contact_name: data.contactName } : {}),
        ...(data.contactEmail ? { p_contact_email: data.contactEmail } : {}),
        ...(data.feedback ? { p_feedback: data.feedback } : {}),
      });

      if (error) {
        if (error.message.includes(RPC_ERROR.REQUIRED_QUESTIONS_UNANSWERED)) {
          return { error: 'respondent.errors.requiredQuestionsUnanswered' };
        }

        return { error: 'respondent.errors.submitFailed' };
      }

      return { success: true };
    },
  }
);
