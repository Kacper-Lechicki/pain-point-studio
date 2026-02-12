import { z } from 'zod';

import {
  QUESTIONS_MAX,
  QUESTIONS_MIN,
  QUESTION_DESCRIPTION_MAX_LENGTH,
  QUESTION_OPTIONS_MAX,
  QUESTION_OPTIONS_MIN,
  QUESTION_OPTION_MAX_LENGTH,
  QUESTION_TEXT_MAX_LENGTH,
  RATING_SCALE_MAX,
  RATING_SCALE_MIN,
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_MAX_RESPONDENTS_MIN,
  SURVEY_TITLE_MAX_LENGTH,
} from '@/features/surveys/config';

// ── Survey metadata schemas ─────────────────────────────────────────

export const surveyMetadataSchema = z
  .object({
    title: z
      .string()
      .min(1, 'surveys.errors.fieldRequired')
      .max(SURVEY_TITLE_MAX_LENGTH, 'surveys.errors.titleTooLong'),
    description: z
      .string()
      .min(1, 'surveys.errors.fieldRequired')
      .max(SURVEY_DESCRIPTION_MAX_LENGTH, 'surveys.errors.descriptionTooLong'),
    category: z.string().min(1, 'surveys.errors.fieldRequired'),
    visibility: z.enum(['private', 'public']),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    maxRespondents: z
      .number()
      .int()
      .min(SURVEY_MAX_RESPONDENTS_MIN, 'surveys.errors.maxRespondentsMin')
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt) {
        const startDate = new Date(data.startsAt);
        const now = new Date(Date.now() - 60_000);

        return startDate >= now;
      }

      return true;
    },
    { message: 'surveys.errors.startDatePast', path: ['startsAt'] }
  )
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }

      return true;
    },
    { message: 'surveys.errors.endDateBeforeStart', path: ['endsAt'] }
  );

export type SurveyMetadataSchema = z.infer<typeof surveyMetadataSchema>;

export const createSurveyDraftSchema = surveyMetadataSchema.and(
  z.object({
    surveyId: z.string().uuid().optional(),
    action: z.enum(['saveDraft', 'next']),
  })
);

export type CreateSurveyDraftSchema = z.infer<typeof createSurveyDraftSchema>;

// ── Question type enum ──────────────────────────────────────────────

export const QUESTION_TYPES = [
  'open_text',
  'short_text',
  'multiple_choice',
  'rating_scale',
  'yes_no',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

// ── Type-specific config schemas ────────────────────────────────────

export const multipleChoiceConfigSchema = z.object({
  options: z
    .array(z.string().max(QUESTION_OPTION_MAX_LENGTH, 'surveys.builder.errors.optionTooLong'))
    .min(QUESTION_OPTIONS_MIN, 'surveys.builder.errors.minOptions')
    .max(QUESTION_OPTIONS_MAX, 'surveys.builder.errors.maxOptions'),
  minSelections: z.number().int().min(1).optional(),
  maxSelections: z.number().int().min(1).optional(),
  allowOther: z.boolean().optional(),
});

export const ratingScaleConfigSchema = z
  .object({
    min: z.number().int().min(RATING_SCALE_MIN, 'surveys.builder.errors.ratingMinValue'),
    max: z.number().int().max(RATING_SCALE_MAX, 'surveys.builder.errors.ratingMaxValue'),
    minLabel: z.string().max(100).optional(),
    maxLabel: z.string().max(100).optional(),
  })
  .refine((data) => data.min < data.max, {
    message: 'surveys.builder.errors.ratingMinGreaterMax',
    path: ['max'],
  });

export const openTextConfigSchema = z.object({
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).optional(),
});

export const shortTextConfigSchema = z.object({
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).optional(),
});

// ── Question schema ─────────────────────────────────────────────────

export const questionSchema = z.object({
  id: z.string().uuid(),
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
  config: z.record(z.string(), z.unknown()).default({}),
});

export type QuestionSchema = z.infer<typeof questionSchema>;

export const surveyQuestionsSchema = z.object({
  surveyId: z.string().uuid(),
  questions: z
    .array(
      questionSchema.extend({
        sortOrder: z.number().int().min(0),
      })
    )
    .min(QUESTIONS_MIN, 'surveys.builder.errors.minQuestions')
    .max(QUESTIONS_MAX, 'surveys.builder.errors.maxQuestions'),
});

export type SurveyQuestionsSchema = z.infer<typeof surveyQuestionsSchema>;

// ── Response types ──────────────────────────────────────────────────

export * from './response';
