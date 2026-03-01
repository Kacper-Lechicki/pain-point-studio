'use server';

import { createNoteFolderSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const createNoteFolder = withProtectedAction<
  typeof createNoteFolderSchema,
  { folderId: string }
>('create-note-folder', {
  schema: createNoteFolderSchema,
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

    const { data: folder, error } = await supabase
      .from('project_note_folders')
      .insert({
        project_id: data.projectId,
        user_id: user.id,
        name: data.name,
      })
      .select('id')
      .single();

    if (error || !folder) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true, data: { folderId: folder.id } };
  },
});
