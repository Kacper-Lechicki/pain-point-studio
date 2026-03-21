'use server';

import { cache } from 'react';

import type { ProjectNoteMeta } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

/** Fetch all notes for a project (excluding content_json for performance). */
export const getProjectNotes = cache(async (projectId: string): Promise<ProjectNoteMeta[]> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_notes')
    .select(
      'id, project_id, user_id, folder_id, title, is_pinned, sort_order, deleted_at, created_at, updated_at'
    )
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
});
