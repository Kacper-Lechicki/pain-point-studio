'use server';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export const getSurveyProjectId = cache(async (surveyId: string): Promise<string | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
