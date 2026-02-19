'use server';

import { cache } from 'react';

import type { MappedQuestion } from '@/features/surveys/lib/map-question-row';
import { mapQuestionRow } from '@/features/surveys/lib/map-question-row';
import {
  SURVEY_VISIBILITY_VALUES,
  type SurveyStatus,
  type SurveyVisibility,
} from '@/features/surveys/types';
import { createServerProviders } from '@/lib/providers/server';

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
    const { auth, db } = await createServerProviders();

    const { data: userData } = await auth.getUser();

    if (!userData?.user) {
      return null;
    }

    const { data: survey } = await db.surveys.findByIdSelect<{
      id: string;
      title: string;
      description: string;
      category: string;
      visibility: string;
      starts_at: string | null;
      ends_at: string | null;
      max_respondents: number | null;
      status: string;
    }>(
      surveyId,
      'id, title, description, category, visibility, starts_at, ends_at, max_respondents, status',
      { userId: userData.user.id }
    );

    if (!survey) {
      return null;
    }

    const { data: questions } = await db.surveyQuestions.findBySurveyId(
      surveyId,
      'id, text, type, required, description, config, sort_order'
    );

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
        status: survey.status as SurveyStatus,
      },
      questions: (questions ?? []).map(mapQuestionRow),
    };
  }
);
