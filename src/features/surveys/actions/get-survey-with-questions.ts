'use server';

import { cache } from 'react';

import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { mapQuestionRow } from '@/features/surveys/lib/map-question-row';
import {
  SURVEY_VISIBILITY_VALUES,
  type SurveyStatus,
  type SurveyVisibility,
} from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

export interface SurveyBuilderData {
  survey: {
    id: string;
    title: string;
    description: string;
    category: string;
    visibility: SurveyVisibility;
    startsAt: string | null;
    endsAt: string | null;
    maxRespondents: number | null;
    status: SurveyStatus;
  };
  questions: MappedQuestion[];
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
        visibility: (survey.visibility as SurveyVisibility) ?? SURVEY_VISIBILITY_VALUES[0],
        startsAt: survey.starts_at,
        endsAt: survey.ends_at,
        maxRespondents: survey.max_respondents,
        status: survey.status,
      },
      questions: (questions ?? []).map(mapQuestionRow),
    };
  }
);
