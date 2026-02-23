'use server';

import { cache } from 'react';

import { getTranslations } from 'next-intl/server';

import { SURVEY_CATEGORIES } from '@/features/surveys/config/survey-categories';
import { sortOptionsAlphabetically } from '@/lib/common/sort-options';
import { createClient } from '@/lib/supabase/server';

export interface SurveyCategoryOption {
  value: string;
  label: string;
}

export interface ProjectOption {
  value: string;
  label: string;
  context: string;
}

export interface SurveyFormData {
  categoryOptions: SurveyCategoryOption[];
  projectOptions: ProjectOption[];
}

export const getSurveyFormData = cache(async (): Promise<SurveyFormData> => {
  const [t, supabase] = await Promise.all([getTranslations(), createClient()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let projectOptions: ProjectOption[] = [];

  if (user) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, context')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('name');

    projectOptions = (projects ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      context: p.context,
    }));
  }

  return {
    categoryOptions: sortOptionsAlphabetically(
      SURVEY_CATEGORIES.map((c) => ({
        value: c.value,
        label: t(c.labelKey as Parameters<typeof t>[0]),
      }))
    ),
    projectOptions,
  };
});
