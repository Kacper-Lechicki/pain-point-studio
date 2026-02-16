'use server';

import { mapRpcError } from '@/features/surveys/config';
import { saveAnswerSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withPublicAction } from '@/lib/common/with-public-action';
import type { Json } from '@/lib/supabase/types';

export const saveAnswer = withPublicAction<typeof saveAnswerSchema, void>('save-answer', {
  schema: saveAnswerSchema,
  rateLimit: RATE_LIMITS.respondentSave,
  action: async ({ data, supabase }) => {
    const { error } = await supabase.rpc('validate_and_save_answer', {
      p_response_id: data.responseId,
      p_question_id: data.questionId,
      p_value: data.value as Json,
    });

    if (error) {
      return { error: `respondent.${mapRpcError(error.message)}` };
    }

    return { success: true };
  },
});
