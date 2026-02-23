'use server';

import { cache } from 'react';

import { z } from 'zod';

import { QUESTION_TYPES, type QuestionType } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

// ── Public types ──────────────────────────────────────────────────────

export interface QuestionSignalData {
  id: string;
  text: string;
  type: QuestionType;
  config: Record<string, unknown>;
  answers: { value: Record<string, unknown> }[];
}

export interface SurveySignalData {
  surveyId: string;
  surveyTitle: string;
  researchPhase: string | null;
  totalResponses: number;
  completedResponses: number;
  questions: QuestionSignalData[];
}

// ── Zod schema ────────────────────────────────────────────────────────

const signalDataSchema = z.array(
  z.object({
    surveyId: z.string(),
    surveyTitle: z.string(),
    researchPhase: z.string().nullable(),
    totalResponses: z.number(),
    completedResponses: z.number(),
    questions: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
          type: z.enum(QUESTION_TYPES),
          config: z.record(z.string(), z.unknown()).default({}),
          answers: z.array(z.object({ value: z.record(z.string(), z.unknown()) })),
        })
      )
      .default([]),
  })
);

// ── Action ────────────────────────────────────────────────────────────

export const getProjectSignalsData = cache(
  async (projectId: string): Promise<SurveySignalData[]> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_project_signals_data', {
      p_project_id: projectId,
      p_user_id: user.id,
    });

    if (error || !data) {
      return [];
    }

    const parsed = signalDataSchema.safeParse(data);

    if (!parsed.success) {
      return [];
    }

    return parsed.data;
  }
);
