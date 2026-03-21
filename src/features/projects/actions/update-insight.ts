'use server';

import { updateInsightSchema } from '@/features/projects/types';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

export const updateInsight = withProtectedAction<typeof updateInsightSchema>('update-insight', {
  schema: updateInsightSchema,
  rateLimit: RATE_LIMITS.crud,
  action: async ({ data, supabase }) => {
    const updatePayload: Record<string, string> = {};

    if (data.type !== undefined) {
      updatePayload.type = data.type;
    }

    if (data.content !== undefined) {
      updatePayload.content = data.content;
    }

    if (data.source !== undefined) {
      updatePayload.source = data.source;
    }

    if (Object.keys(updatePayload).length === 0) {
      return { error: 'projects.errors.unexpected' };
    }

    const { data: row, error } = await supabase
      .from('project_insights')
      .update(updatePayload)
      .eq('id', data.insightId)
      .select('id')
      .maybeSingle();

    if (error || !row) {
      return { error: 'projects.errors.unexpected' };
    }

    return { success: true };
  },
});
