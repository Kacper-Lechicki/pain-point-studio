'use server';

import { cache } from 'react';

import { type UserSurvey, userSurveysRpcSchema } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

export const getProjectSurveys = cache(async (projectId: string): Promise<UserSurvey[] | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_project_surveys_with_counts', {
    p_user_id: user.id,
    p_project_id: projectId,
  });

  if (error) {
    return null;
  }

  if (!data) {
    return [];
  }

  const parsed = userSurveysRpcSchema.safeParse(data);

  return parsed.success ? (parsed.data as UserSurvey[]) : null;
});
