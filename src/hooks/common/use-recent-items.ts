'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { getRecentItems } from '@/features/dashboard/actions/get-recent-items';
import { trackRecentItem } from '@/features/dashboard/actions/track-recent-item';

export interface RecentItem {
  id: string;
  label: string;
  imageUrl?: string | null;
  type: string;
  visited_at: string;
}

type ItemType = 'project' | 'survey';

interface UseRecentItemsOptions {
  limit?: number | undefined;
  projectId?: string | undefined;
}

interface UseRecentItemsReturn {
  items: RecentItem[];
  track: (itemId: string) => void;
}

export function useRecentItems(
  itemType: ItemType,
  options?: UseRecentItemsOptions
): UseRecentItemsReturn {
  const [items, setItems] = useState<RecentItem[]>([]);
  const [, startTransition] = useTransition();

  const limit = options?.limit;
  const projectId = options?.projectId;

  useEffect(() => {
    let cancelled = false;

    void getRecentItems(itemType, { limit, projectId }).then((data) => {
      if (!cancelled) {
        setItems(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [itemType, limit, projectId]);

  const track = useCallback(
    (itemId: string) => {
      void trackRecentItem({ itemId, itemType });

      startTransition(() => {
        void getRecentItems(itemType, { limit, projectId }).then(setItems);
      });
    },
    [itemType, limit, projectId]
  );

  return { items, track };
}
