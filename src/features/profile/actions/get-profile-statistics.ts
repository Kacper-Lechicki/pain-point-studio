'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

export interface ProfileStatistics {
  totalSurveys: number;
  totalResponses: number;
  avgCompletionRate: number;
  memberSince: string;
}

const profileStatisticsSchema = z.object({
  totalSurveys: z.number(),
  totalResponses: z.number(),
  avgCompletionRate: z.number(),
  memberSince: z.string(),
});

export const getProfileStatistics = cache(async (): Promise<ProfileStatistics | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_profile_statistics', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = profileStatisticsSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
