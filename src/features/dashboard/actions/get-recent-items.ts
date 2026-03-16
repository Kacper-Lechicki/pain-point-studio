'use server';

import { cache } from 'react';

import type { RecentItem } from '@/hooks/common/use-recent-items';
import { createClient } from '@/lib/supabase/server';

interface GetRecentItemsOptions {
  limit?: number | undefined;
  projectId?: string | undefined;
}

export const getRecentItems = cache(
  async (
    itemType: 'project' | 'survey',
    options?: GetRecentItemsOptions
  ): Promise<RecentItem[]> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_recent_items', {
      p_item_type: itemType,
      p_limit: options?.limit ?? 5,
      p_project_id: options?.projectId ?? null,
    });

    if (error || !data) {
      return [];
    }

    return data as unknown as RecentItem[];
  }
);
