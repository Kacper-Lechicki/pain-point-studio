'use server';

import { cache } from 'react';

import { type UserSurvey, userSurveysRpcSchema } from '@/features/surveys/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export const getUserSurveys = cache(async (): Promise<UserSurvey[] | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_user_surveys_with_counts', {
    p_user_id: user.id,
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
