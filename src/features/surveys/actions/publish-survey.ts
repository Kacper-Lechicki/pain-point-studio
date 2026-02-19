'use server';

import { z } from 'zod';

import { PG_ERROR, QUESTIONS_MIN, SURVEY_MAX_RESPONDENTS_MIN } from '@/features/surveys/config';
import { generateSurveySlug } from '@/features/surveys/lib/generate-slug';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Schema for publish action — surveyId is required, endsAt and maxRespondents are optional. */
const publishSurveySchema = z.object({
  surveyId: z.string().uuid(),
  endsAt: z.string().nullable().optional(),
  maxRespondents: z.number().int().min(SURVEY_MAX_RESPONDENTS_MIN).nullable().optional(),
});

export const publishSurvey = withProtectedAction<typeof publishSurveySchema, { slug: string }>(
  'publish-survey',
  {
    schema: publishSurveySchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, db }) => {
      // Verify survey has at least QUESTIONS_MIN questions with non-empty text
      const { count } = await db.surveyQuestions.countBySurveyId(data.surveyId, {
        textNotEmpty: true,
      });

      if (!count || count < QUESTIONS_MIN) {
        return { error: 'surveys.builder.errors.minQuestionsToPublish' };
      }

      // Verify the survey exists and is a draft owned by this user
      const { data: survey } = await db.surveys.findByIdSelect<{ id: string }>(
        data.surveyId,
        'id',
        { userId: user.id, status: 'draft' }
      );

      if (!survey) {
        return { error: 'surveys.errors.unexpected' };
      }

      // Validate end date if provided — must be in the future.
      // DateTimePicker already emits an ISO 8601 string (UTC).
      if (data.endsAt) {
        if (new Date(data.endsAt) <= new Date()) {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      // Retry loop for slug collision (unique constraint violation)
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const slug = generateSurveySlug();

        const { data: row, error } = await db.surveys.update(
          data.surveyId,
          {
            status: 'active',
            slug,
            starts_at: new Date().toISOString(),
            ends_at: data.endsAt ?? null,
            max_respondents: data.maxRespondents ?? null,
          },
          { userId: user.id, status: 'draft' }
        );

        if (!error && row) {
          return { success: true, data: { slug } };
        }

        if (!error && !row) {
          return { error: 'surveys.errors.unexpected' };
        }

        if (error!.code !== PG_ERROR.UNIQUE_VIOLATION || attempt >= MAX_RETRIES) {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      return { error: 'surveys.errors.unexpected' };
    },
  }
);
