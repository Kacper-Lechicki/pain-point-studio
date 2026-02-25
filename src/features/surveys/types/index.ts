import { z } from 'zod';

import { RESEARCH_PHASES } from '@/features/projects/types';
import {
  QUESTIONS_MAX,
  QUESTION_DESCRIPTION_MAX_LENGTH,
  QUESTION_OPTIONS_MAX,
  QUESTION_OPTIONS_MIN,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  RATING_LABEL_MAX_LENGTH,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_TITLE_MAX_LENGTH,
  TEXT_PLACEHOLDER_MAX_LENGTH,
} from '@/features/surveys/config';

// ── Enum tuples (source of truth) ───────────────────────────────────

/** All supported question types as a const tuple (source of truth). */
export const QUESTION_TYPES = [
  'open_text',
  'short_text',
  'multiple_choice',
  'rating_scale',
  'yes_no',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

/** All survey lifecycle statuses as a const tuple (source of truth). */
export const SURVEY_STATUSES = ['draft', 'active', 'completed', 'cancelled', 'archived'] as const;

export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

/** All survey visibility options as a const tuple (source of truth). */
export const SURVEY_VISIBILITY_VALUES = ['private', 'public'] as const;

export type SurveyVisibility = (typeof SURVEY_VISIBILITY_VALUES)[number];

/** Possible actions when saving a survey draft. */
export const DRAFT_ACTIONS = ['saveDraft', 'next'] as const;

export type DraftAction = (typeof DRAFT_ACTIONS)[number];

// ── Shared schemas ──────────────────────────────────────────────────

/** Schema for validating a single survey UUID. */
export const surveyIdSchema = z.object({
  surveyId: z.uuid(),
});

// ── Survey metadata schemas ─────────────────────────────────────────

/** Schema for survey metadata fields (title, description, visibility, project linking). */
export const surveyMetadataSchema = z.object({
  title: z
    .string()
    .min(1, 'surveys.errors.fieldRequired')
    .max(SURVEY_TITLE_MAX_LENGTH, 'surveys.errors.titleTooLong'),
  description: z
    .string()
    .min(1, 'surveys.errors.fieldRequired')
    .max(SURVEY_DESCRIPTION_MAX_LENGTH, 'surveys.errors.descriptionTooLong'),
  visibility: z.enum(SURVEY_VISIBILITY_VALUES),
  projectId: z.uuid().nullable().optional(),
  researchPhase: z.enum(RESEARCH_PHASES).nullable().optional(),
});

export type SurveyMetadataSchema = z.infer<typeof surveyMetadataSchema>;

/** Extends metadata schema with optional surveyId, action, and project linking. */
export const createSurveyDraftSchema = surveyMetadataSchema.and(
  z.object({
    surveyId: z.uuid().optional(),
    action: z.enum(DRAFT_ACTIONS),
    projectId: z.uuid().nullable().optional(),
  })
);

export type CreateSurveyDraftSchema = z.infer<typeof createSurveyDraftSchema>;

// ── Type-specific config schemas ────────────────────────────────────

/** Config schema for multiple-choice questions (options, selection limits). */
export const multipleChoiceConfigSchema = z.object({
  options: z
    .array(z.string().max(QUESTION_OPTION_MAX_LENGTH, 'surveys.builder.errors.optionTooLong'))
    .min(QUESTION_OPTIONS_MIN, 'surveys.builder.errors.minOptions')
    .max(QUESTION_OPTIONS_MAX, 'surveys.builder.errors.maxOptions'),
  minSelections: z.number().int().min(1).optional(),
  maxSelections: z.number().int().min(1).optional(),
  allowOther: z.boolean().optional(),
});

/** Config schema for rating-scale questions (min/max values, labels). */
export const ratingScaleConfigSchema = z
  .object({
    min: z.number().int().min(RATING_SCALE_MIN, 'surveys.builder.errors.ratingMinValue'),
    max: z.number().int().max(RATING_SCALE_MAX, 'surveys.builder.errors.ratingMaxValue'),
    minLabel: z.string().max(RATING_LABEL_MAX_LENGTH).optional(),
    maxLabel: z.string().max(RATING_LABEL_MAX_LENGTH).optional(),
  })
  .refine((data) => data.min < data.max, {
    message: 'surveys.builder.errors.ratingMinGreaterMax',
    path: ['max'],
  });

/** Config schema for text questions (placeholder, max length). */
export const textConfigSchema = z.object({
  placeholder: z.string().max(TEXT_PLACEHOLDER_MAX_LENGTH).optional(),
  maxLength: z.number().int().min(1).optional(),
});

// ── Question schema ─────────────────────────────────────────────────

/** Max serialized config size in characters (prevents oversized JSON payloads). */
const CONFIG_MAX_JSON_LENGTH = 2_000;

/** Validates that a config object doesn't exceed a safe serialized size. */
const configSchema = z
  .record(z.string(), z.unknown())
  .default({})
  .refine((val) => JSON.stringify(val).length <= CONFIG_MAX_JSON_LENGTH, {
    message: 'surveys.builder.errors.configTooLarge',
  });

/** Schema for a single survey question (text, type, required flag, config). */
export const questionSchema = z.object({
  id: z.uuid(),
  text: z
    .string()
    .min(1, 'surveys.builder.errors.questionTextRequired')
    .max(QUESTION_TEXT_MAX_LENGTH, 'surveys.builder.errors.questionTextTooLong'),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  description: z
    .string()
    .max(QUESTION_DESCRIPTION_MAX_LENGTH, 'surveys.builder.errors.descriptionTooLong')
    .nullable()
    .optional(),
  config: configSchema,
});

export type QuestionSchema = z.infer<typeof questionSchema>;

/** Relaxed question schema for saving drafts (empty text allowed). */
const draftQuestionSchema = z.object({
  id: z.uuid(),
  text: z.string().max(QUESTION_TEXT_MAX_LENGTH, 'surveys.builder.errors.questionTextTooLong'),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  description: z
    .string()
    .max(QUESTION_DESCRIPTION_MAX_LENGTH, 'surveys.builder.errors.descriptionTooLong')
    .nullable()
    .optional(),
  config: configSchema,
  sortOrder: z.number().int().min(0),
});

/** Schema for saving a full set of survey questions with sort order. */
export const surveyQuestionsSchema = z.object({
  surveyId: z.uuid(),
  questions: z.array(draftQuestionSchema).max(QUESTIONS_MAX, 'surveys.builder.errors.maxQuestions'),
});

export type SurveyQuestionsSchema = z.infer<typeof surveyQuestionsSchema>;

// ── Response types ──────────────────────────────────────────────────

export * from './response';
