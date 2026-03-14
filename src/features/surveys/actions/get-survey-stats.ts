'use server';

import { cache } from 'react';

import { type SurveyStats, surveyStatsRpcSchema } from '@/features/surveys/types';
import { createClient } from '@/lib/supabase/server';

export const getSurveyStats = cache(async (surveyId: string): Promise<SurveyStats | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_survey_stats_data', {
    p_survey_id: surveyId,
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = surveyStatsRpcSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data as SurveyStats;
});
