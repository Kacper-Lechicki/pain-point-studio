'use server';

import { cache } from 'react';

import type { ProjectNote } from '@/features/projects/types';
import { createClient } from '@/lib/supabase/server';

/** Fetch a single note with full content (for the editor). */
export const getProjectNote = cache(async (noteId: string): Promise<ProjectNote | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
