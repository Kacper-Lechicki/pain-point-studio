'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

import type { QuestionType } from '../types';

export interface SurveyBuilderData {
  survey: {
    id: string;
    title: string;
    description: string;
    category: string;
    visibility: 'private' | 'public';
    startsAt: string | null;
    endsAt: string | null;
    maxRespondents: number | null;
    status: 'draft' | 'active' | 'closed' | 'archived';
  };
  questions: Array<{
    id: string;
    text: string;
    type: QuestionType;
    required: boolean;
    description: string | null;
    config: Record<string, unknown>;
    sortOrder: number;
  }>;
}

export const getSurveyWithQuestions = cache(
  async (surveyId: string): Promise<SurveyBuilderData | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: survey } = await supabase
      .from('surveys')
      .select(
        'id, title, description, category, visibility, starts_at, ends_at, max_respondents, status'
      )
      .eq('id', surveyId)
      .eq('user_id', user.id)
      .single();

    if (!survey) {
      return null;
    }

    const { data: questions } = await supabase
      .from('survey_questions')
      .select('id, text, type, required, description, config, sort_order')
      .eq('survey_id', surveyId)
      .order('sort_order');

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description ?? '',
        category: survey.category ?? '',
        visibility: (survey.visibility as 'private' | 'public') ?? 'private',
        startsAt: survey.starts_at,
        endsAt: survey.ends_at,
        maxRespondents: survey.max_respondents,
        status: survey.status,
      },
      questions: (questions ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type as QuestionType,
        required: q.required,
        description: q.description,
        config: (q.config as Record<string, unknown>) ?? {},
        sortOrder: q.sort_order,
      })),
    };
  }
);
