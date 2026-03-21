'use server';

import { cache } from 'react';

import { type ProjectOverviewStats, projectOverviewStatsSchema } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export const getProjectOverviewStats = cache(
  async (projectId: string): Promise<ProjectOverviewStats | null> => {
    const { user, supabase } = await getAuthenticatedClient();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase.rpc('get_project_detail_stats', {
      p_project_id: projectId,
      p_user_id: user.id,
    });

    if (error || !data) {
      return null;
    }

    const parsed = projectOverviewStatsSchema.safeParse(data);

    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }
);
