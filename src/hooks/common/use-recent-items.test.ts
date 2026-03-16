import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecentItems } from './use-recent-items';

const mockGetRecentItems = vi.fn();
const mockTrackRecentItem = vi.fn();

vi.mock('@/features/dashboard/actions/get-recent-items', () => ({
  getRecentItems: (...args: unknown[]) => mockGetRecentItems(...args),
}));

vi.mock('@/features/dashboard/actions/track-recent-item', () => ({
  trackRecentItem: (...args: unknown[]) => mockTrackRecentItem(...args),
}));

describe('useRecentItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecentItems.mockResolvedValue([]);
    mockTrackRecentItem.mockResolvedValue({ success: true });
  });

  it('should return empty array initially', () => {
    const { result } = renderHook(() => useRecentItems('project'));
    expect(result.current.items).toEqual([]);
  });

  it('should fetch items from server on mount', async () => {
    const mockData = [{ id: '1', label: 'Project A', type: 'project', visited_at: '2026-01-01' }];
    mockGetRecentItems.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRecentItems('project'));

    await waitFor(() => {
      expect(result.current.items).toEqual(mockData);
    });

    expect(mockGetRecentItems).toHaveBeenCalledWith('project', {
      limit: undefined,
      projectId: undefined,
    });
  });

  it('should call trackRecentItem server action on track()', async () => {
    const { result } = renderHook(() => useRecentItems('project'));

    act(() => {
      result.current.track('item-123');
    });

    expect(mockTrackRecentItem).toHaveBeenCalledWith({
      itemId: 'item-123',
      itemType: 'project',
    });
  });

  it('should call trackRecentItem with survey type', async () => {
    const { result } = renderHook(() => useRecentItems('survey'));

    act(() => {
      result.current.track('survey-456');
    });

    expect(mockTrackRecentItem).toHaveBeenCalledWith({
      itemId: 'survey-456',
      itemType: 'survey',
    });
  });

  it('should refetch items after tracking', async () => {
    const initialData = [
      { id: '1', label: 'Project A', type: 'project', visited_at: '2026-01-01' },
    ];
    const updatedData = [
      { id: '2', label: 'Project B', type: 'project', visited_at: '2026-01-02' },
      ...initialData,
    ];

    mockGetRecentItems.mockResolvedValueOnce(initialData).mockResolvedValueOnce(updatedData);

    const { result } = renderHook(() => useRecentItems('project'));

    await waitFor(() => {
      expect(result.current.items).toEqual(initialData);
    });

    act(() => {
      result.current.track('2');
    });

    await waitFor(() => {
      expect(result.current.items).toEqual(updatedData);
    });
  });
});
