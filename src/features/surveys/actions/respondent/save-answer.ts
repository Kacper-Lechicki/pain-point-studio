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
      if (error.message.includes('QUESTION_SURVEY_MISMATCH')) {
        return { error: 'respondent.errors.saveFailed' };
      }

      if (error.message.includes('RESPONSE_ALREADY_COMPLETED')) {
        return { error: 'respondent.errors.saveFailed' };
      }

      return { error: 'respondent.errors.saveFailed' };
    }

    return { success: true };
  },
});
