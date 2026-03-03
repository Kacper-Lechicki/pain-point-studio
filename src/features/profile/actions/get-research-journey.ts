'use server';

import { cache } from 'react';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const researchJourneySchema = z.object({
  memberSince: z.string(),
  firstProjectAt: z.string().nullable(),
  firstSurveyAt: z.string().nullable(),
  firstResponseAt: z.string().nullable(),
  totalResponses: z.number(),
});

export type ResearchJourneyRpc = z.infer<typeof researchJourneySchema>;

/**
 * Fetch research journey milestone data via get_research_journey RPC.
 * Returns null when unauthenticated, on RPC error, or when the response fails validation.
 * Wrapped with React `cache()` for per-request deduplication.
 */
export const getResearchJourney = cache(async (): Promise<ResearchJourneyRpc | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_research_journey', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = researchJourneySchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
