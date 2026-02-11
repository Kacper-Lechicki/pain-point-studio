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
      // Verify survey ownership
      const { data: survey } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .single();

      if (!survey) {
        return { error: 'surveys.errors.unexpected' };
      }

      // Delete all existing questions and re-insert (simpler than diffing for MVP)
      const { error: deleteError } = await supabase
        .from('survey_questions')
        .delete()
        .eq('survey_id', data.surveyId);

      if (deleteError) {
        return { error: mapSupabaseError(deleteError.message) };
      }

      if (data.questions.length > 0) {
        const { error: insertError } = await supabase.from('survey_questions').insert(
          data.questions.map((q) => ({
            id: q.id,
            survey_id: data.surveyId,
            text: q.text,
            type: q.type,
            required: q.required,
            description: q.description ?? null,
            config: q.config as Json,
            sort_order: q.sortOrder,
          }))
        );

        if (insertError) {
          return { error: mapSupabaseError(insertError.message) };
        }
      }

      return { success: true };
    },
  }
);
