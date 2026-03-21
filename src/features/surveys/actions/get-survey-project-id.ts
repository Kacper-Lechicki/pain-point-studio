'use server';

import { cache } from 'react';

import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export const getSurveyProjectId = cache(async (surveyId: string): Promise<string | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('surveys')
    .select('project_id')
    .eq('id', surveyId)
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.project_id ?? null;
});
