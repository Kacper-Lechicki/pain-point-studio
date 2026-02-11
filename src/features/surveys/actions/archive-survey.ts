'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

const archiveSurveySchema = z.object({
  surveyId: z.string().uuid(),
});

export const archiveSurvey = withProtectedAction<typeof archiveSurveySchema, void>(
  'archive-survey',
  {
    schema: archiveSurveySchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, user, supabase }) => {
      const { error } = await supabase
        .from('surveys')
        .update({ status: 'archived' as const })
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .in('status', ['active', 'closed'] as const);

      if (error) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
