'use server';

import { createProjectNoteSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const createProjectNote = withProtectedAction<
  typeof createProjectNoteSchema,
  { noteId: string }
>('create-project-note', {
  schema: createProjectNoteSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!project) {
      return { error: 'projects.errors.unexpected' };
    }

    const { data: note, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: data.projectId,
        user_id: user.id,
        title: data.title || 'Untitled',
        folder_id: data.folderId ?? null,
      })
      .select('id')
      .single();

    if (error || !note) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true, data: { noteId: note.id } };
  },
});
