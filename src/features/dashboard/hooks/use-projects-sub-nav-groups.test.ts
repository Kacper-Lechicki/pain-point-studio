import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SubNavGroup } from '@/features/dashboard/config/navigation';

import { useProjectsSubNavGroups } from './use-projects-sub-nav-groups';

const mockGetRecentItems = vi.fn();

vi.mock('@/features/dashboard/actions/get-recent-items', () => ({
  getRecentItems: (...args: unknown[]) => mockGetRecentItems(...args),
}));

vi.mock('@/features/dashboard/actions/track-recent-item', () => ({
  trackRecentItem: vi.fn().mockResolvedValue({ success: true }),
}));

const STATIC_GROUPS: SubNavGroup[] = [
  {
    items: [
      { labelKey: 'sidebar.allProjects', icon: {} as never, href: '/dashboard/projects' as never },
    ],
  },
];

describe('useProjectsSubNavGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecentItems.mockResolvedValue([]);
  });

  it('should return static groups unchanged when not projects nav', () => {
    const { result } = renderHook(() => useProjectsSubNavGroups(STATIC_GROUPS, false));

    expect(result.current).toBe(STATIC_GROUPS);
  });

  it('should append recent group when projects nav', () => {
    const { result } = renderHook(() => useProjectsSubNavGroups(STATIC_GROUPS, true));

    expect(result.current).toHaveLength(2);
    expect(result.current[1]!.headingKey).toBe('sidebar.recentProjects');
    expect(result.current[1]!.emptyMessageKey).toBe('sidebar.noRecentProjects');
    expect(result.current[1]!.items).toEqual([]);
  });

  it('should include recent items from server', async () => {
    const serverData = [
      { id: 'abc', label: 'Project A', type: 'project', visited_at: '2026-01-02' },
      { id: 'def', label: 'Project B', type: 'project', visited_at: '2026-01-01' },
    ];
    mockGetRecentItems.mockResolvedValue(serverData);

    const { result } = renderHook(() => useProjectsSubNavGroups(STATIC_GROUPS, true));

    await waitFor(() => {
      const recentGroup = result.current[1]!;
      expect(recentGroup.items).toHaveLength(2);
    });

    const recentGroup = result.current[1]!;
    expect(recentGroup.items[0]!.label).toBe('Project A');
    expect(recentGroup.items[0]!.href).toContain('abc');
    expect(recentGroup.items[1]!.label).toBe('Project B');
  });
});
