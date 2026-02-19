'use server';

import { surveyQuestionsSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapAuthError } from '@/lib/providers/server';
import type { Json } from '@/lib/providers/types';

export const saveSurveyQuestions = withProtectedAction<typeof surveyQuestionsSchema, void>(
  'save-survey-questions',
  {
    schema: surveyQuestionsSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, user, db }) => {
      const { data: survey } = await db.surveys.findByIdSelect<{ id: string }>(
        data.surveyId,
        'id',
        { userId: user.id, status: 'draft' }
      );

      if (!survey) {
        return { error: 'surveys.errors.unexpected' };
      }

      const questionsPayload = data.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        required: false,
        description: q.description ?? null,
        config: q.config,
        sortOrder: q.sortOrder,
      }));

      const { error } = await db.rpc('save_survey_questions', {
        p_survey_id: data.surveyId,
        p_user_id: user.id,
        p_questions: questionsPayload as unknown as Json,
      });

      if (error) {
        return { error: mapAuthError(error.message) };
      }

      return { success: true };
    },
  }
);
