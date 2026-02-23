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
      const { data: row, error } = await supabase
        .from('surveys')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          visibility: data.visibility,
          project_id: data.projectId ?? null,
          research_phase: data.researchPhase ?? null,
        })
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .select('id')
        .maybeSingle();

      if (error) {
        return { error: mapSupabaseError(error.message) };
      }

      if (!row) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true, data: { surveyId: row.id } };
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
        project_id: data.projectId ?? null,
        research_phase: data.researchPhase ?? null,
      })
      .select('id')
      .single();

    if (error) {
      return { error: mapSupabaseError(error.message) };
    }

    if (!survey) {
      return { error: 'surveys.errors.unexpected' };
    }

    return { success: true, data: { surveyId: survey.id } };
  },
});
