'use server';

import { cache } from 'react';

import { z } from 'zod';

import { QUESTION_TYPES, type QuestionType, type SurveyStatus } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

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
  responseTimeline: number[];
  avgCompletionSeconds: number | null;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  questions: QuestionStats[];
}

const surveyStatsRpcSchema = z.object({
  survey: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string().nullable(),
    status: z.string(),
    startsAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
    endsAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
    maxRespondents: z.number().nullable(),
  }),
  totalResponses: z.number(),
  completedResponses: z.number(),
  inProgressResponses: z.number(),
  responseTimeline: z.array(z.number()).default([]),
  avgCompletionSeconds: z.number().nullable().default(null),
  firstResponseAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
  lastResponseAt: z.unknown().transform((v) => (typeof v === 'string' ? v : null)),
  questions: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        type: z.enum(QUESTION_TYPES),
        sortOrder: z.number(),
        answers: z.array(
          z.object({
            value: z.record(z.string(), z.unknown()),
            completedAt: z.string().nullable(),
          })
        ),
      })
    )
    .default([]),
});

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

  const parsed = surveyStatsRpcSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data as SurveyStats;
});
