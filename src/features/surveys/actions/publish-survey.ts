'use server';

import { z } from 'zod';

import { PG_ERROR, QUESTIONS_MIN, SURVEY_MAX_RESPONDENTS_MIN } from '@/features/surveys/config';
import { generateSurveySlug } from '@/features/surveys/lib/generate-slug';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

/** Schema for publish action — surveyId is required, endsAt and maxRespondents are optional. */
const publishSurveySchema = z.object({
  surveyId: z.uuid(),
  endsAt: z.string().nullable().optional(),
  maxRespondents: z.number().int().min(SURVEY_MAX_RESPONDENTS_MIN).nullable().optional(),
});

export const publishSurvey = withProtectedAction<typeof publishSurveySchema, { slug: string }>(
  'publish-survey',
  {
    schema: publishSurveySchema,
    rateLimit: RATE_LIMITS.crud,
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

      // Verify the survey exists and is a draft owned by this user
      const { data: survey } = await supabase
        .from('surveys')
        .select('id, project_id')
        .eq('id', data.surveyId)
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .maybeSingle();

      if (!survey) {
        return { error: 'surveys.errors.unexpected' };
      }

      // Verify the parent project is in a valid state for publishing
      if (survey.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('status')
          .eq('id', survey.project_id)
          .maybeSingle();

        if (!project || project.status !== 'active') {
          return { error: 'surveys.errors.projectNotActive' };
        }

        // Check project response limit
        const { data: remaining } = await supabase.rpc('get_project_remaining_capacity', {
          p_project_id: survey.project_id,
        });

        if (remaining != null && (remaining as number) <= 0) {
          return { error: 'surveys.errors.projectLimitReached' };
        }

        // Cap maxRespondents to remaining project capacity
        if (
          data.maxRespondents &&
          remaining != null &&
          data.maxRespondents > (remaining as number)
        ) {
          data.maxRespondents = remaining as number;
        }
      }

      // Validate end date if provided — must be in the future (compare in UTC).
      if (data.endsAt) {
        const endsAtMs = new Date(data.endsAt).getTime();
        const nowMs = Date.now();

        if (Number.isNaN(endsAtMs) || endsAtMs <= nowMs) {
          return { error: 'surveys.errors.unexpected' };
        }
      }

      // Retry loop for slug collision (unique constraint violation)
      const MAX_RETRIES = 3;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const slug = generateSurveySlug();

        const { data: row, error } = await supabase
          .from('surveys')
          .update({
            status: 'active',
            slug,
            starts_at: new Date().toISOString(),
            ends_at: data.endsAt ?? null,
            max_respondents: data.maxRespondents ?? null,
          })
          .eq('id', data.surveyId)
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .select('id')
          .maybeSingle();

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
