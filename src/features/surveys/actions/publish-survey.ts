'use server';

import { withProtectedAction } from '@/lib/common/with-protected-action';

import { PG_ERROR, QUESTIONS_MIN } from '../config';
import { generateSurveySlug } from '../lib/generate-slug';
import { surveyIdSchema } from '../types';

export const publishSurvey = withProtectedAction<typeof surveyIdSchema, { slug: string }>(
  'publish-survey',
  {
    schema: surveyIdSchema,
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

      // Retry loop for slug collision (unique constraint violation)
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const slug = generateSurveySlug();

        const { error } = await supabase
          .from('surveys')
          .update({ status: 'active', slug })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'draft');

        if (!error) {
          return { success: true, data: { slug } };
        }

        if (error.code !== PG_ERROR.UNIQUE_VIOLATION || attempt >= MAX_RETRIES) {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      return { error: 'surveys.errors.unexpected' };
    },
  }
);
