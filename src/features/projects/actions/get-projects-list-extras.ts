'use server';

import { cache } from 'react';

import { type ProjectsListExtrasMap, projectExtrasMapSchema } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

export type {
  ProjectListExtras,
  SparklinePoint,
  ProjectsListExtrasMap,
} from '@/features/projects/types';

export const getProjectsListExtras = cache(async (): Promise<ProjectsListExtrasMap | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
