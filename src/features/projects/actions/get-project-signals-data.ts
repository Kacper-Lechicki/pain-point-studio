'use server';

import type { QuestionType } from '@/features/surveys/types';

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
