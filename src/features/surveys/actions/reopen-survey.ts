'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

const reopenSurveySchema = z.object({
  surveyId: z.string().uuid(),
});

export const reopenSurvey = withProtectedAction<typeof reopenSurveySchema, void>('reopen-survey', {
  schema: reopenSurveySchema,
  rateLimit: { limit: 10, windowSeconds: 300 },
  action: async ({ data, user, supabase }) => {
    const { error } = await supabase
      .from('surveys')
      .update({ status: 'active' as const })
      .eq('id', data.surveyId)
      .eq('user_id', user.id)
      .eq('status', 'closed' as const);

    if (error) {
      return { error: 'surveys.errors.unexpected' };
    }

    return { success: true };
  },
});
