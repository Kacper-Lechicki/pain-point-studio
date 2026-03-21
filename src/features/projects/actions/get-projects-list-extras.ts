'use server';

import { cache } from 'react';

import { type ProjectsListExtrasMap, projectExtrasMapSchema } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

export type {
  ProjectListExtras,
  SparklinePoint,
  ProjectsListExtrasMap,
} from '@/features/projects/types';

export const getProjectsListExtras = cache(async (): Promise<ProjectsListExtrasMap | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_projects_list_extras', {
    p_user_id: user.id,
  });

  if (error || !data) {
    return null;
  }

  const parsed = projectExtrasMapSchema.safeParse(data);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
});
