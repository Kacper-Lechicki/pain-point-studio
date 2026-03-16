'use client';

import { useMemo } from 'react';

import { FolderKanban } from 'lucide-react';

import type { SubNavGroup } from '@/features/dashboard/config/navigation';
import { useRecentItems } from '@/hooks/common/use-recent-items';
import type { MessageKey } from '@/i18n/types';
import { getProjectDetailUrl } from '@/lib/common/urls/project-urls';

export function useProjectsSubNavGroups(
  staticGroups: SubNavGroup[],
  isProjectsNav: boolean
): SubNavGroup[] {
  const { items } = useRecentItems('project', { limit: 10 });

  return useMemo(() => {
    if (!isProjectsNav) {
      return staticGroups;
    }

    const recentGroup: SubNavGroup = {
      headingKey: 'sidebar.recentProjects' as MessageKey,
      emptyMessageKey: 'sidebar.noRecentProjects' as MessageKey,
      items: items.map((item) => ({
        label: item.label,
        icon: FolderKanban,
        href: getProjectDetailUrl(item.id),
      })),
    };

    return [...staticGroups, recentGroup];
  }, [staticGroups, isProjectsNav, items]);
}
