'use server';

import { reorderInsightsSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const reorderInsights = withProtectedAction<typeof reorderInsightsSchema>(
  'reorder-insights',
  {
    schema: reorderInsightsSchema,
    rateLimit: RATE_LIMITS.frequentSave,
    action: async ({ data, supabase }) => {
      const updates = data.insightIds.map((insightId, index) =>
        supabase.from('project_insights').update({ sort_order: index }).eq('id', insightId)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        return { error: 'projects.errors.unexpected' };
      }

      return { success: true };
    },
  }
);
