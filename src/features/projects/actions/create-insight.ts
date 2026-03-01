'use server';

import { createInsightSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const createInsight = withProtectedAction<typeof createInsightSchema, { insightId: string }>(
  'create-insight',
  {
    schema: createInsightSchema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', data.projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!project) {
        return { error: 'projects.errors.unexpected' };
      }

      // Assign sort_order to place new insight at end of its column.
      const { data: maxRow } = await supabase
        .from('project_insights')
        .select('sort_order')
        .eq('project_id', data.projectId)
        .eq('type', data.type)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;

      const { data: insight, error } = await supabase
        .from('project_insights')
        .insert({
          project_id: data.projectId,
          type: data.type,
          content: data.content,
          sort_order: nextSortOrder,
        })
        .select('id')
        .single();

      if (error || !insight) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true, data: { insightId: insight.id } };
    },
  }
);
