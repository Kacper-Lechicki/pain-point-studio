'use server';

import { createSurveyDraftSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const createSurveyDraft = withProtectedAction<
  typeof createSurveyDraftSchema,
  { surveyId: string }
>('create-survey-draft', {
  schema: createSurveyDraftSchema,
  rateLimit: RATE_LIMITS.bulkCreate,
  action: async ({ data, user, supabase }) => {
    if (data.surveyId) {
      const { error } = await supabase
        .from('surveys')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          visibility: data.visibility,
          starts_at: data.startsAt,
          ends_at: data.endsAt,
          max_respondents: data.maxRespondents,
        })
        .eq('id', data.surveyId)
        .eq('user_id', user.id);

      if (error) {
        return { error: mapSupabaseError(error.message) };
      }

      return { success: true, data: { surveyId: data.surveyId } };
    }

    const { data: survey, error } = await supabase
      .from('surveys')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        visibility: data.visibility,
        status: 'draft',
        starts_at: data.startsAt,
        ends_at: data.endsAt,
        max_respondents: data.maxRespondents,
      })
      .select('id')
      .single();

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    return { success: true, data: { surveyId: survey.id } };
  },
});
