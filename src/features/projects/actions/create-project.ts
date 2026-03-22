'use server';

import { isTiptapEmpty } from '@/components/shared/rich-editor/utils';
import { createProjectSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';
import { mapSupabaseError } from '@/lib/supabase/errors';

export const createProject = withProtectedAction<typeof createProjectSchema, { projectId: string }>(
  'create-project',
  {
    schema: createProjectSchema,
    rateLimit: RATE_LIMITS.bulkCreate,
    action: async ({ data, user, supabase }) => {
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', data.name)
        .neq('status', 'trashed')
        .maybeSingle();

      if (existing) {
        return { error: 'projects.errors.nameAlreadyExists' };
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: data.name,
          summary: data.summary || null,
          description:
            data.description && !isTiptapEmpty(data.description) ? data.description : null,
        })
        .select('id')
        .single();

      if (error) {
        return { error: mapSupabaseError(error.message) };
      }

      if (!project) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true, data: { projectId: project.id } };
    },
  }
);
