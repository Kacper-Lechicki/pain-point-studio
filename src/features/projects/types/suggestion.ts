import { z } from 'zod';

import { INSIGHT_CONTENT_MAX_LENGTH } from '@/features/projects/config';
import { INSIGHT_TYPES } from '@/features/projects/types/project';

// ── Suggestion type ──────────────────────────────────────────────────

/** An auto-generated insight suggestion derived from survey findings. */
export interface InsightSuggestion {
  /** Stable signature: e.g. "{surveyId}:{questionId}:yes_no". */
  signature: string;
  /** Pre-formatted suggestion text. */
  content: string;
  /** Source info for display. */
  source: {
    surveyTitle: string;
    questionText?: string;
  };
}

// ── Zod schemas ──────────────────────────────────────────────────────

/** Schema for accepting a suggestion (creates insight + records action). */
export const acceptSuggestionSchema = z.object({
  projectId: z.string().uuid(),
  signature: z.string().min(1).max(500),
  type: z.enum(INSIGHT_TYPES),
  content: z
    .string()
    .trim()
    .min(1, 'projects.errors.fieldRequired')
    .max(INSIGHT_CONTENT_MAX_LENGTH, 'projects.errors.contentTooLong'),
});

/** Schema for dismissing a suggestion. */
export const dismissSuggestionSchema = z.object({
  projectId: z.string().uuid(),
  signature: z.string().min(1).max(500),
});
