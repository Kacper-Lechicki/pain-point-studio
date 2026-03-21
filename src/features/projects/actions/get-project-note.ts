'use server';

import { cache } from 'react';

import type { ProjectNote } from '@/features/projects/types';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

/** Fetch a single note with full content (for the editor). */
export const getProjectNote = cache(async (noteId: string): Promise<ProjectNote | null> => {
  const { user, supabase } = await getAuthenticatedClient();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('project_notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
});
