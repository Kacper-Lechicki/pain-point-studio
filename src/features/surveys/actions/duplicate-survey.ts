'use server';

import { surveyIdSchema } from '@/features/surveys/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const duplicateSurvey = withProtectedAction<typeof surveyIdSchema, { surveyId: string }>(
  'duplicate-survey',
  {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.bulkCreate,
    action: async ({ data, user, supabase }) => {
      const { data: original, error: fetchError } = await supabase
        .from('surveys')
        .select('title, description, visibility, max_respondents, research_phase, project_id')
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError || !original) {
        return { error: 'surveys.errors.unexpected' };
      }

      const { data: newSurvey, error: insertError } = await supabase
        .from('surveys')
        .insert({
          user_id: user.id,
          title: `${original.title} (copy)`,
          description: original.description,
          visibility: original.visibility,
          max_respondents: original.max_respondents,
          research_phase: original.research_phase,
          project_id: original.project_id,
          status: 'draft',
        })
        .select('id')
        .single();

      if (insertError || !newSurvey) {
        return { error: 'surveys.errors.unexpected' };
      }

      const { data: questions } = await supabase
        .from('survey_questions')
        .select('text, type, required, description, config, sort_order')
        .eq('survey_id', data.surveyId)
        .order('sort_order');

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

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questionRows);

        if (questionsError) {
          // Clean up the survey if questions failed to copy
          await supabase
            .from('surveys')
            .delete()
            .eq('id', newSurvey.id)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();

          return { error: 'surveys.errors.unexpected' };
        }
      }

      return { success: true, data: { surveyId: newSurvey.id } };
    },
  }
);
