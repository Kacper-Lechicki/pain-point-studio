'use server';

import { dismissSuggestionSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const dismissSuggestion = withProtectedAction<typeof dismissSuggestionSchema>(
  'dismiss-suggestion',
  {
    schema: dismissSuggestionSchema,
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

      // Record the dismissal (upsert to handle race conditions)
      const { error } = await supabase.from('insight_suggestion_actions').upsert(
        {
          project_id: data.projectId,
          signature: data.signature,
          action: 'dismissed',
        },
        { onConflict: 'project_id,signature' }
      );

      if (error) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
