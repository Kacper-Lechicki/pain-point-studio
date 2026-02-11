'use server';

import { withPublicAction } from '@/lib/common/with-public-action';
import type { Json } from '@/lib/supabase/types';

import { saveAnswerSchema } from '../../types';

export const saveAnswer = withPublicAction<typeof saveAnswerSchema, void>('save-answer', {
  schema: saveAnswerSchema,
  rateLimit: { limit: 120, windowSeconds: 60 },
  action: async ({ data, supabase }) => {
    const { error } = await supabase.from('survey_answers').upsert(
      {
        response_id: data.responseId,
        question_id: data.questionId,
        value: data.value as Json,
      },
      { onConflict: 'response_id,question_id' }
    );

    if (error) {
      return { error: 'respondent.errors.saveFailed' };
    }

    return { success: true };
  },
});
