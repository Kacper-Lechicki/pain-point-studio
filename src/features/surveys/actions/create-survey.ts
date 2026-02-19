'use server';

import { createSurveyDraftSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapAuthError } from '@/lib/providers/server';

export const createSurveyDraft = withProtectedAction<
  typeof createSurveyDraftSchema,
  { surveyId: string }
>('create-survey-draft', {
  schema: createSurveyDraftSchema,
  rateLimit: RATE_LIMITS.bulkCreate,
  action: async ({ data, user, db }) => {
    if (data.surveyId) {
      const { data: row, error } = await db.surveys.update(
        data.surveyId,
        {
          title: data.title,
          description: data.description,
          category: data.category,
          visibility: data.visibility,
        },
        { userId: user.id, status: 'draft' }
      );

      if (error) {
        return { error: mapAuthError(error.message) };
      }

      if (!row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true, data: { surveyId: row.id } };
    }

    const { data: survey, error } = await db.surveys.insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      visibility: data.visibility,
      status: 'draft',
    });

    if (error) {
      return { error: mapAuthError(error.message) };
    }

    if (!survey) {
      return { error: 'surveys.errors.unexpected' };
    }

    return { success: true, data: { surveyId: survey.id } };
  },
});
