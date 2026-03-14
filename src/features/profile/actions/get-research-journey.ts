'use server';

import { cache } from 'react';

import { type ResearchJourney, researchJourneySchema } from '@/features/profile/types';
import { createClient } from '@/lib/supabase/server';

export const getResearchJourney = cache(async (): Promise<ResearchJourney | null> => {
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
