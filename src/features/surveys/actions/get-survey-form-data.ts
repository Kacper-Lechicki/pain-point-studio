'use server';

import { cache } from 'react';

import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export interface ProjectOption {
  value: string;
  label: string;
}

interface SurveyFormData {
  projectOptions: ProjectOption[];
}

export const getSurveyFormData = cache(async (): Promise<SurveyFormData> => {
  const { user, supabase } = await getAuthenticatedClient();

  let projectOptions: ProjectOption[] = [];

  if (user) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('name');

    projectOptions = (projects ?? []).map((p) => ({
      value: p.id,
      label: p.name,
    }));
  }

  return {
    projectOptions,
  };
});
