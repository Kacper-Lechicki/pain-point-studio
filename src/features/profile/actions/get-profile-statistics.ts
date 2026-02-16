'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// ── Validation schema for the get_profile_statistics RPC response ───

const profileStatisticsSchema = z.object({
  totalSurveys: z.number(),
  totalResponses: z.number(),
  avgSubmissionRate: z.number(),
  memberSince: z.string(),
});

export type ProfileStatistics = z.infer<typeof profileStatisticsSchema>;

/**
 * Fetch profile statistics via get_profile_statistics RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
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
