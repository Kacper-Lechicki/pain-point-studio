import { z } from 'zod';

import type { QuestionType } from './index';

// ── Server action input schemas ─────────────────────────────────────

export const startResponseSchema = z.object({
  surveyId: z.string().uuid(),
});

export type StartResponseSchema = z.infer<typeof startResponseSchema>;

export const saveAnswerSchema = z.object({
  responseId: z.string().uuid(),
  questionId: z.string().uuid(),
  value: z.record(z.string(), z.unknown()),
});

export type SaveAnswerSchema = z.infer<typeof saveAnswerSchema>;

export const submitResponseSchema = z.object({
  responseId: z.string().uuid(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().max(320).optional().or(z.literal('')),
  feedback: z.string().max(2000).optional(),
});

export type SubmitResponseSchema = z.infer<typeof submitResponseSchema>;

// ── Public survey data shape (returned to client) ───────────────────

export interface PublicSurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  description: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
}

export interface PublicSurveyData {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  responseCount: number;
  isAcceptingResponses: boolean;
  closedReason?: 'closed' | 'expired' | 'max_reached';
  questions: PublicSurveyQuestion[];
}
