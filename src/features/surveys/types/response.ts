import { z } from 'zod';

import type { QuestionType } from './index';

// ── Answer value schemas by question type ───────────────────────────

export const openTextAnswerSchema = z.object({
  text: z.string().max(5000),
});

export const shortTextAnswerSchema = z.object({
  text: z.string().max(500),
});

export const multipleChoiceAnswerSchema = z.object({
  selected: z.array(z.string()).min(1),
  other: z.string().max(200).nullable().optional(),
});

export const ratingScaleAnswerSchema = z.object({
  rating: z.number().int().min(1).max(10),
});

export const yesNoAnswerSchema = z.object({
  answer: z.boolean(),
});

// ── Discriminated validator ─────────────────────────────────────────

export function validateAnswerValue(
  type: QuestionType,
  value: unknown
): { success: boolean; error?: z.ZodError } {
  let result;

  switch (type) {
    case 'open_text':
      result = openTextAnswerSchema.safeParse(value);
      break;
    case 'short_text':
      result = shortTextAnswerSchema.safeParse(value);
      break;
    case 'multiple_choice':
      result = multipleChoiceAnswerSchema.safeParse(value);
      break;
    case 'rating_scale':
      result = ratingScaleAnswerSchema.safeParse(value);
      break;
    case 'yes_no':
      result = yesNoAnswerSchema.safeParse(value);
      break;
  }

  return result.success ? { success: true } : { success: false, error: result.error };
}

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
