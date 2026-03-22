'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const schema = z.object({
  name: z.string().trim().min(1),
  /** Exclude this project from the check (for rename flows). */
  excludeProjectId: z.string().uuid().optional(),
});

/**
 * Lightweight check that returns `{ exists: true }` when the current user
 * already owns a project with the given name (case-insensitive).
 */
export const checkProjectNameExists = withProtectedAction<typeof schema, { exists: boolean }>(
  'check-project-name-exists',
  {
    schema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      let query = supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', data.name)
        .neq('status', 'trashed');

      if (data.excludeProjectId) {
        query = query.neq('id', data.excludeProjectId);
      }

      const { data: existing } = await query.maybeSingle();

      return { success: true, data: { exists: !!existing } };
    },
  }
);
