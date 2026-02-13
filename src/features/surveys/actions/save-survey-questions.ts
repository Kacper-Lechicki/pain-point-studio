'use server';

import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';
import type { Json } from '@/lib/supabase/types';

import { surveyQuestionsSchema } from '../types';

export const saveSurveyQuestions = withProtectedAction<typeof surveyQuestionsSchema, void>(
  'save-survey-questions',
  {
    schema: surveyQuestionsSchema,
    rateLimit: { limit: 60, windowSeconds: 60 },
    action: async ({ data, user, supabase }) => {
      const questionsPayload = data.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        required: false,
        description: q.description ?? null,
        config: q.config,
        sortOrder: q.sortOrder,
      }));

      const { error } = await supabase.rpc('save_survey_questions', {
        p_survey_id: data.surveyId,
        p_user_id: user.id,
        p_questions: questionsPayload as unknown as Json,
      });

      if (error) {
        return { error: mapSupabaseError(error.message) };
      }

      return { success: true };
    },
  }
);
