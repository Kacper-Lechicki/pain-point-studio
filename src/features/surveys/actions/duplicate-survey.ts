'use server';

import { surveyIdSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const duplicateSurvey = withProtectedAction<typeof surveyIdSchema, { surveyId: string }>(
  'duplicate-survey',
  {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.bulkCreate,
    action: async ({ data, user, db }) => {
      const { data: original, error: fetchError } = await db.surveys.findByIdSelect<{
        title: string;
        description: string;
        category: string;
        visibility: string;
        max_respondents: number | null;
      }>(data.surveyId, 'title, description, category, visibility, max_respondents', {
        userId: user.id,
      });

      if (fetchError || !original) {
        return { error: 'surveys.errors.unexpected' };
      }

      const { data: newSurvey, error: insertError } = await db.surveys.insert({
        user_id: user.id,
        title: `${original.title} (copy)`,
        description: original.description,
        category: original.category,
        visibility: original.visibility,
        max_respondents: original.max_respondents,
        status: 'draft',
      });

      if (insertError || !newSurvey) {
        return { error: 'surveys.errors.unexpected' };
      }

      const { data: questions } = await db.surveyQuestions.findBySurveyId(
        data.surveyId,
        'text, type, required, description, config, sort_order'
      );

      if (questions && questions.length > 0) {
        const questionRows = questions.map((q) => ({
          survey_id: newSurvey.id,
          text: q.text,
          type: q.type,
          required: q.required,
          description: q.description,
          config: q.config,
          sort_order: q.sort_order,
        }));

        const { error: questionsError } = await db.surveyQuestions.insert(questionRows);

        if (questionsError) {
          // Clean up the survey if questions failed to copy
          await db.surveys.delete(newSurvey.id, { userId: user.id });

          return { error: 'surveys.errors.unexpected' };
        }
      }

      return { success: true, data: { surveyId: newSurvey.id } };
    },
  }
);
