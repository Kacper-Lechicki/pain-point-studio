'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import { mapQuestionRow } from '../../lib/map-question-row';
import type { PublicSurveyData } from '../../types';

export const getPublicSurvey = cache(async (slug: string): Promise<PublicSurveyData | null> => {
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from('surveys')
    .select('id, title, description, status, starts_at, ends_at, max_respondents, cancelled_at')
    .eq('slug', slug)
    .in('status', ['active', 'pending', 'closed', 'cancelled'])
    .single();

  if (!survey) {
    return null;
  }

  // Cancelled surveys are only accessible for 30 days after cancellation
  if (survey.status === 'cancelled') {
    const cancelledAt = survey.cancelled_at ? new Date(survey.cancelled_at) : null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (!cancelledAt || cancelledAt < thirtyDaysAgo) {
      return null;
    }
  }

  // Determine if accepting responses
  const now = new Date();
  let isAcceptingResponses = survey.status === 'active';
  let closedReason: PublicSurveyData['closedReason'];

  if (survey.status === 'pending') {
    isAcceptingResponses = false;
    closedReason = 'not_started';
  } else if (survey.status === 'closed') {
    isAcceptingResponses = false;
    closedReason = 'closed';
  } else if (survey.status === 'cancelled') {
    isAcceptingResponses = false;
    closedReason = 'cancelled';
  } else if (survey.status === 'active') {
    // Active survey — check time and respondent limits
    if (survey.ends_at && new Date(survey.ends_at) < now) {
      isAcceptingResponses = false;
      closedReason = 'expired';
    }
  }

  // Get questions (available for active and pending surveys)
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
    (responseCount ?? 0) >= survey.max_respondents
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
    responseCount: responseCount ?? 0,
    isAcceptingResponses,
    ...(closedReason && { closedReason }),
    ...(survey.status === 'pending' && survey.starts_at && { startsAt: survey.starts_at }),
    questions: mappedQuestions,
  };
});
