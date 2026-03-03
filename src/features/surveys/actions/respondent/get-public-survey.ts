'use server';

import { cache } from 'react';

import { SURVEY_RETENTION_DAYS } from '@/features/surveys/config';
import { mapQuestionRow } from '@/features/surveys/lib/map-question-row';
import type { PublicSurveyData } from '@/features/surveys/types';
import { rateLimit } from '@/lib/common/rate-limit';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { createClient } from '@/lib/supabase/server';

const getPublicSurveyCached = cache(async (slug: string): Promise<PublicSurveyData | null> => {
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from('surveys')
    .select(
      'id, title, description, status, starts_at, ends_at, max_respondents, completed_at, cancelled_at'
    )
    .eq('slug', slug)
    .in('status', ['active', 'completed', 'cancelled'])
    .single();

  if (!survey) {
    return null;
  }

  // Completed and cancelled surveys are only accessible for SURVEY_RETENTION_DAYS
  if (survey.status === 'completed' || survey.status === 'cancelled') {
    const closedAt =
      survey.status === 'completed'
        ? survey.completed_at
          ? new Date(survey.completed_at)
          : null
        : survey.cancelled_at
          ? new Date(survey.cancelled_at)
          : null;

    const retentionCutoff = new Date(Date.now() - SURVEY_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    if (!closedAt || closedAt < retentionCutoff) {
      return null;
    }
  }

  // Determine if accepting responses
  const now = new Date();

  let isAcceptingResponses = survey.status === 'active';
  let closedReason: PublicSurveyData['closedReason'];

  if (survey.status === 'completed') {
    isAcceptingResponses = false;
    closedReason = 'completed';
  } else if (survey.status === 'cancelled') {
    isAcceptingResponses = false;
    closedReason = 'cancelled';
  } else if (survey.status === 'active') {
    // Active survey — check time limits
    if (survey.starts_at && new Date(survey.starts_at) > now) {
      isAcceptingResponses = false;
      closedReason = 'not_started';
    } else if (survey.ends_at && new Date(survey.ends_at) < now) {
      isAcceptingResponses = false;
      closedReason = 'expired';
    }
  }

  // Get questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, text, type, required, description, config, sort_order')
    .eq('survey_id', survey.id)
    .order('sort_order');

  // Get response count
  const { data: responseCount } = await supabase.rpc('get_survey_response_count', {
    p_survey_id: survey.id,
  });

  // Check max_respondents limit (only relevant for active surveys)
  if (
    survey.status === 'active' &&
    survey.max_respondents &&
    ((responseCount as number) ?? 0) >= survey.max_respondents
  ) {
    isAcceptingResponses = false;
    closedReason = 'max_reached';
  }

  const mappedQuestions = (questions ?? []).map(mapQuestionRow);

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questionCount: mappedQuestions.length,
    responseCount: (responseCount as number) ?? 0,
    isAcceptingResponses,
    ...(closedReason && { closedReason }),
    questions: mappedQuestions,
  };
});

export async function getPublicSurvey(slug: string): Promise<PublicSurveyData | null> {
  const { limited } = await rateLimit({ key: 'get-public-survey', ...RATE_LIMITS.respondentRead });

  if (limited) {
    return null;
  }

  return getPublicSurveyCached(slug);
}
