'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

const closeSurveySchema = z.object({
  surveyId: z.string().uuid(),
});

export const closeSurvey = withProtectedAction<typeof closeSurveySchema, void>('close-survey', {
  schema: closeSurveySchema,
  rateLimit: { limit: 10, windowSeconds: 300 },
  action: async ({ data, user, supabase }) => {
    const { error } = await supabase
      .from('surveys')
      .update({ status: 'closed' as const })
      .eq('id', data.surveyId)
      .eq('user_id', user.id)
      .eq('status', 'active' as const);

    if (error) {
      return { error: 'surveys.errors.unexpected' };
    }

    return { success: true };
  },
});
