'use server';

import { cache } from 'react';

import type { ProjectInsight } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

export const getProjectInsights = cache(async (projectId: string): Promise<ProjectInsight[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_insights')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
});
