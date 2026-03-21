'use server';

import { cache } from 'react';

import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { mapQuestionRow } from '@/features/surveys/lib/map-question-row';
import {
  SURVEY_VISIBILITY_VALUES,
  type SurveyStatus,
  type SurveyVisibility,
} from '@/features/surveys/types';
import type { ResearchPhase } from '@/lib/common/research';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

interface SurveyBuilderData {
  survey: {
    id: string;
    title: string;
    description: string;
    visibility: SurveyVisibility;
    startsAt: string | null;
    endsAt: string | null;
    maxRespondents: number | null;
    status: SurveyStatus;
    projectId: string;
    researchPhase: ResearchPhase | null;
  };
  questions: MappedQuestion[];
}

export const getSurveyWithQuestions = cache(
  async (surveyId: string): Promise<SurveyBuilderData | null> => {
    const { user, supabase } = await getAuthenticatedClient();

    if (!user) {
      return null;
    }

    const surveyQuery = supabase
      .from('surveys')
      .select(
        'id, title, description, visibility, starts_at, ends_at, max_respondents, status, project_id, research_phase'
      )
      .eq('id', surveyId)
      .eq('user_id', user.id)
      .maybeSingle();

    const questionsQuery = supabase
      .from('survey_questions')
      .select('id, text, type, required, description, config, sort_order')
      .eq('survey_id', surveyId)
      .order('sort_order');

    const [surveyResult, questionsResult] = await Promise.all([surveyQuery, questionsQuery]);

    const survey = surveyResult.data as {
      id: string;
      title: string;
      description: string;
      visibility: string;
      starts_at: string | null;
      ends_at: string | null;
      max_respondents: number | null;
      status: string;
      project_id: string;
      research_phase: string | null;
    } | null;

    if (!survey) {
      return null;
    }

    return {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description ?? '',
        visibility: (survey.visibility as SurveyVisibility) ?? SURVEY_VISIBILITY_VALUES[0],
        startsAt: survey.starts_at,
        endsAt: survey.ends_at,
        maxRespondents: survey.max_respondents,
        status: survey.status as SurveyStatus,
        projectId: survey.project_id,
        researchPhase: survey.research_phase as ResearchPhase | null,
      },
      questions: (questionsResult.data ?? []).map(mapQuestionRow),
    };
  }
);
