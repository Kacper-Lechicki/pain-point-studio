'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import type { PublicSurveyData, PublicSurveyQuestion } from '../../types';
import type { QuestionType } from '../../types';

export const getPublicSurvey = cache(async (slug: string): Promise<PublicSurveyData | null> => {
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from('surveys')
    .select('id, title, description, status, starts_at, ends_at, max_respondents')
    .eq('slug', slug)
    .single();

  if (!survey) {
    return null;
  }

  // Determine if accepting responses
  const now = new Date();
  let isAcceptingResponses = survey.status === 'active';
  let closedReason: PublicSurveyData['closedReason'];

  if (survey.status !== 'active') {
    isAcceptingResponses = false;
    closedReason = 'closed';
  } else if (survey.ends_at && new Date(survey.ends_at) < now) {
    isAcceptingResponses = false;
    closedReason = 'expired';
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

  // Check max_respondents limit
  if (survey.max_respondents && (responseCount ?? 0) >= survey.max_respondents) {
    isAcceptingResponses = false;
    closedReason = 'max_reached';
  }

  const mappedQuestions: PublicSurveyQuestion[] = (questions ?? []).map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type as QuestionType,
    required: q.required,
    description: q.description,
    config: (q.config as Record<string, unknown>) ?? {},
    sortOrder: q.sort_order,
  }));

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    questionCount: mappedQuestions.length,
    responseCount: responseCount ?? 0,
    isAcceptingResponses,
    ...(closedReason && { closedReason }),
    questions: mappedQuestions,
  };
});
