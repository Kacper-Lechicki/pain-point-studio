'use server';

import { withPublicAction } from '@/lib/common/with-public-action';

import { submitResponseSchema } from '../../types';

export const submitResponse = withPublicAction<typeof submitResponseSchema, void>(
  'submit-response',
  {
    schema: submitResponseSchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, supabase }) => {
      const { error } = await supabase
        .from('survey_responses')
        .update({
          status: 'completed' as const,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          feedback: data.feedback || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', data.responseId)
        .eq('status', 'in_progress');

      if (error) {
        return { error: 'respondent.errors.submitFailed' };
      }

      return { success: true };
    },
  }
);
