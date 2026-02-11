import { z } from 'zod';

import {
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_MAX_RESPONDENTS_MIN,
  SURVEY_TITLE_MAX_LENGTH,
} from '@/features/surveys/config';

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
