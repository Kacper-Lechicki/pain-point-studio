'use server';

import { cache } from 'react';

import type { ProjectInsight } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export const getProjectInsights = cache(async (projectId: string): Promise<ProjectInsight[]> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_insights')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
});
