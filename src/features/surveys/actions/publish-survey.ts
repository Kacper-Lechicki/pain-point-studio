'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

import { QUESTIONS_MIN } from '../config';
import { generateSurveySlug } from '../lib/generate-slug';

const publishSurveySchema = z.object({
  surveyId: z.string().uuid(),
});

export const publishSurvey = withProtectedAction<typeof publishSurveySchema, { slug: string }>(
  'publish-survey',
  {
    schema: publishSurveySchema,
    rateLimit: { limit: 10, windowSeconds: 300 },
    action: async ({ data, user, supabase }) => {
      // Verify survey has at least QUESTIONS_MIN questions with non-empty text
      const { count } = await supabase
        .from('survey_questions')
        .select('id', { count: 'exact', head: true })
        .eq('survey_id', data.surveyId)
        .neq('text', '');

      if (!count || count < QUESTIONS_MIN) {
        return { error: 'surveys.builder.errors.minQuestionsToPublish' };
      }

      const slug = generateSurveySlug();

      const { error } = await supabase
        .from('surveys')
        .update({ status: 'active' as const, slug })
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .eq('status', 'draft' as const);

      if (error) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true, data: { slug } };
    },
  }
);
