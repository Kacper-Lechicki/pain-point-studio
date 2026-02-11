'use server';

import { cache } from 'react';

import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';

export interface SurveyCategoryOption {
  value: string;
  label: string;
}

export interface SurveyFormData {
  categoryOptions: SurveyCategoryOption[];
}

export const getSurveyFormData = cache(async (): Promise<SurveyFormData> => {
  const supabase = await createClient();
  const t = await getTranslations();

  const { data: categories } = await supabase
    .from('survey_categories')
    .select('value, label_key')
    .eq('is_active', true)
    .order('sort_order');

  return {
    categoryOptions: (categories ?? []).map((c) => ({
      value: c.value,
      label: t(c.label_key as Parameters<typeof t>[0]),
    })),
  };
});
