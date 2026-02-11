'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import type { QuestionType } from '../types';

export interface QuestionAnswerData {
  value: Record<string, unknown>;
  completedAt: string | null;
}

export interface QuestionStats {
  id: string;
  text: string;
  type: QuestionType;
  sortOrder: number;
  answers: QuestionAnswerData[];
}

export interface SurveyStats {
  survey: {
    id: string;
    title: string;
    slug: string | null;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
    maxRespondents: number | null;
  };
  totalResponses: number;
  completedResponses: number;
  inProgressResponses: number;
  questions: QuestionStats[];
}

export const getSurveyStats = cache(async (surveyId: string): Promise<SurveyStats | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch survey (owner check via RLS)
  const { data: survey } = await supabase
    .from('surveys')
    .select('id, title, slug, status, starts_at, ends_at, max_respondents')
    .eq('id', surveyId)
    .eq('user_id', user.id)
    .single();

  if (!survey) {
    return null;
  }

  // Fetch all responses
  const { data: responses } = await supabase
    .from('survey_responses')
    .select('id, status, completed_at')
    .eq('survey_id', surveyId);

  // Fetch questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('id, text, type, sort_order')
    .eq('survey_id', surveyId)
    .order('sort_order');

  // Fetch all answers for completed responses
  const completedResponseIds = (responses ?? [])
    .filter((r) => r.status === 'completed')
    .map((r) => r.id);

  let allAnswers: Array<{ question_id: string; value: unknown; response_id: string }> = [];

  if (completedResponseIds.length > 0) {
    const { data: answers } = await supabase
      .from('survey_answers')
      .select('question_id, value, response_id')
      .in('response_id', completedResponseIds);

    allAnswers = answers ?? [];
  }

  // Group answers by question
  const answersByQuestion = new Map<string, typeof allAnswers>();

  for (const a of allAnswers) {
    const existing = answersByQuestion.get(a.question_id) ?? [];
    existing.push(a);
    answersByQuestion.set(a.question_id, existing);
  }

  // Map response completedAt by id
  const responseMap = new Map((responses ?? []).map((r) => [r.id, r.completed_at]));

  return {
    survey: {
      id: survey.id,
      title: survey.title,
      slug: survey.slug,
      status: survey.status,
      startsAt: survey.starts_at,
      endsAt: survey.ends_at,
      maxRespondents: survey.max_respondents,
    },
    totalResponses: responses?.length ?? 0,
    completedResponses: completedResponseIds.length,
    inProgressResponses: (responses ?? []).filter((r) => r.status === 'in_progress').length,
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type as QuestionType,
      sortOrder: q.sort_order,
      answers: (answersByQuestion.get(q.id) ?? []).map((a) => ({
        value: a.value as Record<string, unknown>,
        completedAt: responseMap.get(a.response_id) ?? null,
      })),
    })),
  };
});
