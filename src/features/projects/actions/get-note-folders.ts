'use server';

import { cache } from 'react';

import type { ProjectNoteFolder } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

/** Fetch all note folders for a project. */
export const getNoteFolders = cache(async (projectId: string): Promise<ProjectNoteFolder[]> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_note_folders')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data;
});
