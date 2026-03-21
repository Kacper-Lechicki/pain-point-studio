'use server';

import { cache } from 'react';

import type { RecentItem } from '@/hooks/common/use-recent-items';
import { getAuthenticatedClient } from '@/lib/supabase/get-authenticated-client';

interface GetRecentItemsOptions {
  limit?: number | undefined;
  projectId?: string | undefined;
}

export const getRecentItems = cache(
  async (
    itemType: 'project' | 'survey',
    options?: GetRecentItemsOptions
  ): Promise<RecentItem[]> => {
    const { user, supabase } = await getAuthenticatedClient();

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
