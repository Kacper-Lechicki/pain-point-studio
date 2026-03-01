'use server';

import { cache } from 'react';

import type { ProjectNoteFolder } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

/** Fetch all note folders for a project. */
export const getNoteFolders = cache(async (projectId: string): Promise<ProjectNoteFolder[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
