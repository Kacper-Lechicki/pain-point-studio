'use server';

import { z } from 'zod';

import { withProtectedAction } from '@/lib/common/with-protected-action';

const trackRecentItemSchema = z.object({
  itemId: z.string().uuid(),
  itemType: z.enum(['project', 'survey']),
});

export const trackRecentItem = withProtectedAction('trackRecentItem', {
  schema: trackRecentItemSchema,
  rateLimit: { limit: 30, windowSeconds: 300 },
  action: async ({ data, supabase }) => {
    await supabase.rpc('upsert_recent_item', {
      p_item_id: data.itemId,
      p_item_type: data.itemType,
    });

    return { success: true };
  },
});
