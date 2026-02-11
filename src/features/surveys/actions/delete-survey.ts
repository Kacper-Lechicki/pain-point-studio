'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

const deleteSurveySchema = z.object({
  surveyId: z.string().uuid(),
});

export const deleteSurveyDraft = withProtectedAction<typeof deleteSurveySchema, void>(
  'delete-survey',
  {
    schema: deleteSurveySchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, user, supabase }) => {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .eq('status', 'draft' as const);

      if (error) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
