'use server';

import { z } from 'zod';

import type { ResponseDetail } from '@/features/surveys/types/response-list';
import { RATE_LIMITS } from '@/lib/common/rate-limit-presets';
import { withProtectedAction } from '@/lib/common/with-protected-action';

const schema = z.object({
  responseId: z.string().uuid(),
});

export const getResponseDetail = withProtectedAction<typeof schema, ResponseDetail>(
  'get-response-detail',
  {
    schema,
    rateLimit: RATE_LIMITS.crud,
    action: async ({ data, user, supabase }) => {
      const { data: result, error } = await supabase.rpc('get_response_detail', {
        p_response_id: data.responseId,
        p_user_id: user.id,
      });

      if (error) {
        return { error: 'surveys.errors.unexpected' };
      }

      const parsed = result as ResponseDetail | null;

      if (!parsed) {
        return { error: 'surveys.errors.unexpected' };
      }

      return { success: true, data: parsed };
    },
  }
);
