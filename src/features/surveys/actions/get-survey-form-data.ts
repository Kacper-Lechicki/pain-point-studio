'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface ProjectOption {
  value: string;
  label: string;
  context: string;
}

export interface SurveyFormData {
  projectOptions: ProjectOption[];
}

export const getSurveyFormData = cache(async (): Promise<SurveyFormData> => {
  const supabase = await createClient();

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
    projectOptions,
  };
});
