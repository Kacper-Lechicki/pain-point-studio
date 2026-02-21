'use server';

import { z } from 'zod';

import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const deleteInsightSchema = z.object({
  insightId: z.uuid(),
});

export const deleteInsight = withProtectedAction<typeof deleteInsightSchema>('delete-insight', {
  schema: deleteInsightSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, supabase }) => {
    const { data: row, error } = await supabase
      .from('project_insights')
      .delete()
      .eq('id', data.insightId)
      .select('id')
      .maybeSingle();

    if (error || !row) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
