'use server';

import { cache } from 'react';

import { type OverviewProject, overviewResponseSchema } from '@/features/dashboard/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

interface DashboardOverview {
  projects: OverviewProject[];
}

export const getDashboardOverview = cache(async (): Promise<DashboardOverview | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_dashboard_overview', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = overviewResponseSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return { projects: parsed.data };
});
