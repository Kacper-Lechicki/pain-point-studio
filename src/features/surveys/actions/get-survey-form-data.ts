'use server';

import { cache } from 'react';

import { getTranslations } from 'next-intl/server';

import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';

export interface SurveyCategoryOption {
  value: string;
  label: string;
}

export interface SurveyFormData {
  categoryOptions: SurveyCategoryOption[];
}

export const getSurveyFormData = cache(async (): Promise<SurveyFormData> => {
  const t = await getTranslations();

  return {
    categoryOptions: sortOptionsAlphabetically(
      SURVEY_CATEGORIES.map((c) => ({
        value: c.value,
        label: t(c.labelKey as Parameters<typeof t>[0]),
      }))
    ),
  };
});
