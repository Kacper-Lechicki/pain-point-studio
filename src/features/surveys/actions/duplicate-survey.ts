'use server';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

import { surveyIdSchema } from '../types';

export const duplicateSurvey = withProtectedAction<typeof surveyIdSchema, { surveyId: string }>(
  'duplicate-survey',
  {
    schema: surveyIdSchema,
    rateLimit: RATE_LIMITS.bulkCreate,
    action: async ({ data, user, supabase }) => {
      // Fetch original survey (must belong to user)
      const { data: original, error: fetchError } = await supabase
        .from('surveys')
        .select('title, description, category, visibility, max_respondents')
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !original) {
        return { error: 'surveys.errors.unexpected' };
      }

      // Create new draft survey (copy metadata, reset scheduling)
      const { data: newSurvey, error: insertError } = await supabase
        .from('surveys')
        .insert({
          user_id: user.id,
          title: `${original.title} (copy)`,
          description: original.description,
          category: original.category,
          visibility: original.visibility,
          max_respondents: original.max_respondents,
          status: 'draft',
        })
        .select('id')
        .single();

      if (insertError || !newSurvey) {
        return { error: 'surveys.errors.unexpected' };
      }

      // Copy questions
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
          await supabase.from('surveys').delete().eq('id', newSurvey.id);

          return { error: 'surveys.errors.unexpected' };
        }
      }

      return { success: true, data: { surveyId: newSurvey.id } };
    },
  }
);
