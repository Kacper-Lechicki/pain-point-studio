'use server';

import { isProjectReadOnly } from '@/features/projects/lib/project-helpers';
import { updateProjectSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const updateProject = withProtectedAction<typeof updateProjectSchema>('update-project', {
  schema: updateProjectSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, user, supabase }) => {
    // Read-only guard: reject edits to completed/archived projects
    const { data: project } = await supabase
      .from('projects')
      .select('status')
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!project || isProjectReadOnly(project.status)) {
      return { error: 'projects.errors.readOnly' };
    }

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', data.name)
      .neq('id', data.projectId)
      .maybeSingle();

    if (existing) {
      return { error: 'projects.errors.nameAlreadyExists' };
    }

    const { data: row, error } = await supabase
      .from('projects')
      .update({
        name: data.name,
        summary: data.summary || null,
        ...(data.targetResponses != null && { target_responses: data.targetResponses }),
      })
      .eq('id', data.projectId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();

    if (error || !row) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
