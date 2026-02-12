'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import type { QuestionType, SurveyStatus } from '../types';

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
    status: SurveyStatus;
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

  const { data, error } = await supabase.rpc('get_survey_stats_data', {
    p_survey_id: surveyId,
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const result = data as unknown as {
    survey: SurveyStats['survey'];
    totalResponses: number;
    completedResponses: number;
    inProgressResponses: number;
    questions: Array<{
      id: string;
      text: string;
      type: string;
      sortOrder: number;
      answers: Array<{ value: Record<string, unknown>; completedAt: string | null }>;
    }>;
  };

  return {
    survey: result.survey,
    totalResponses: result.totalResponses,
    completedResponses: result.completedResponses,
    inProgressResponses: result.inProgressResponses,
    questions: (result.questions ?? []).map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type as QuestionType,
      sortOrder: q.sortOrder,
      answers: q.answers,
    })),
  };
});
