// @vitest-environment jsdom
/** Tests for the generic useItemSelection hook that syncs selection state with URL search params. */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useItemSelection } from './use-item-selection';

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams('selected=item-1');

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

// ── Helpers ──────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
}

interface TestDetail {
  description: string;
}

const ITEMS: TestItem[] = [
  { id: 'item-1', name: 'Item One' },
  { id: 'item-2', name: 'Item Two' },
];

const mockFetchDetail = vi.fn<(id: string) => Promise<TestDetail | null>>();

function renderSelectionHook() {
  return renderHook(() =>
    useItemSelection<TestItem, TestDetail>({ items: ITEMS, fetchDetail: mockFetchDetail })
  );
}

// ── Tests ────────────────────────────────────────────────────────────

describe('useItemSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('selected=item-1');
    mockFetchDetail.mockResolvedValue({ description: 'Detail for item' });
  });

  it('should return selectedId and selectedItem from searchParams', async () => {
    const { result } = renderSelectionHook();

    await waitFor(() => {
      expect(result.current.selectedId).toBe('item-1');
      expect(result.current.selectedItem?.id).toBe('item-1');
      expect(result.current.selectedItem?.name).toBe('Item One');
      expect(result.current.showSheet).toBe(true);
    });
  });

  it('should call fetchDetail with the selected ID', async () => {
    renderSelectionHook();

    await waitFor(() => {
      expect(mockFetchDetail).toHaveBeenCalledWith('item-1');
    });
  });

  it('should set detailData when fetchDetail resolves', async () => {
    const { result } = renderSelectionHook();

    await waitFor(() => {
      expect(result.current.detailData).toEqual({ description: 'Detail for item' });
    });
  });

  it('should not call fetchDetail twice for the same ID (dedup ref)', async () => {
    const { rerender } = renderSelectionHook();

    await waitFor(() => {
      expect(mockFetchDetail).toHaveBeenCalledTimes(1);
    });

    rerender();

    expect(mockFetchDetail).toHaveBeenCalledTimes(1);
  });

  it('should return null selectedItem when no matching item exists', () => {
    mockSearchParams = new URLSearchParams('selected=nonexistent');
    const { result } = renderSelectionHook();

    expect(result.current.selectedItem).toBeNull();
    expect(result.current.showSheet).toBe(false);
  });

  it('should return null selectedId when no search param is set', () => {
    mockSearchParams = new URLSearchParams();
    const { result } = renderSelectionHook();

    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.showSheet).toBe(false);
  });

  it('should call router.replace with selected param when setSelected is called', () => {
    const { result } = renderSelectionHook();

    act(() => {
      result.current.setSelected('item-2');
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard?selected=item-2');
  });

  it('should call router.replace without query when setSelected(null) is called', () => {
    const { result } = renderSelectionHook();

    act(() => {
      result.current.setSelected(null);
    });

    expect(mockReplace).toHaveBeenCalledWith('/en/dashboard');
  });
});
