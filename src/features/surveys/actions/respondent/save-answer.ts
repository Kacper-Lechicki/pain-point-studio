'use server';

import { withPublicAction } from '@/lib/common/with-public-action';
import type { Json } from '@/lib/supabase/types';

import { saveAnswerSchema } from '../../types';

export const saveAnswer = withPublicAction<typeof saveAnswerSchema, void>('save-answer', {
  schema: saveAnswerSchema,
  rateLimit: { limit: 120, windowSeconds: 60 },
  action: async ({ data, supabase }) => {
    const { error } = await supabase.rpc('validate_and_save_answer', {
      p_response_id: data.responseId,
      p_question_id: data.questionId,
      p_value: data.value as Json,
    });

    if (error) {
      return { error: 'respondent.errors.saveFailed' };
    }

    return { success: true };
  },
});
