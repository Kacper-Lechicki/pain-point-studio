'use server';

import { cache } from 'react';

import {
  type DashboardStats,
  dashboardStatsSchema,
} from '@/features/dashboard/types/dashboard-stats';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export const getDashboardStats = cache(async (days: number): Promise<DashboardStats | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_user_id: user.id,
    p_days: days,
  });

  if (error || !data) {
    return null;
  }

  const parsed = dashboardStatsSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
