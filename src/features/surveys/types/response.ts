import { z } from 'zod';

// ── Server action input schemas ─────────────────────────────────────

/** Identical to `surveyIdSchema` — inlined to avoid circular index ↔ response import. */
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

/**
 * Public-facing question shape — structurally identical to `MappedQuestion`
 * from `lib/map-question-row.ts`. Defined here independently to avoid a
 * circular module dependency (types → lib → types) that Turbopack cannot
 * resolve at build time.
 */
export interface PublicSurveyQuestion {
  id: string;
  text: string;
  type: 'open_text' | 'short_text' | 'multiple_choice' | 'rating_scale' | 'yes_no';
  required: boolean;
  description: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
}

export interface CompletedData {
  timestamp: number;
  responseId: string;
}

export interface PublicSurveyData {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  responseCount: number;
  isAcceptingResponses: boolean;
  closedReason?: 'closed' | 'expired' | 'max_reached' | 'not_started';
  questions: PublicSurveyQuestion[];
}
