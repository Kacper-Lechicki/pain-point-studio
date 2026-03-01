'use server';

import { moveInsightSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const moveInsight = withProtectedAction<typeof moveInsightSchema>('move-insight', {
  schema: moveInsightSchema,
  rateLimit: RATE_LIMITS.frequentSave,
  action: async ({ data, supabase }) => {
    // 1. Update the moved insight's type
    const { error: typeError } = await supabase
      .from('project_insights')
      .update({ type: data.newType })
      .eq('id', data.insightId);

    if (typeError) {
      return { error: 'projects.errors.unexpected' };
    }

    // 2. Re-index target column sort_order
    const targetUpdates = data.targetColumnInsightIds.map((id, index) =>
      supabase.from('project_insights').update({ sort_order: index }).eq('id', id)
    );

    // 3. Re-index source column sort_order
    const sourceUpdates = data.sourceColumnInsightIds.map((id, index) =>
      supabase.from('project_insights').update({ sort_order: index }).eq('id', id)
    );

    const results = await Promise.all([...targetUpdates, ...sourceUpdates]);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
