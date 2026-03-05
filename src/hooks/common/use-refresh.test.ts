// @vitest-environment jsdom
/** useRefresh hook: triggers router refresh with pending state. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRefresh } from './use-refresh';

const mocks = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.mockRefresh }),
}));

// ── useRefresh ───────────────────────────────────────────────────────

describe('useRefresh', () => {
  it('should return isRefreshing, refresh, lastSyncedAt and markSynced', () => {
    const { result } = renderHook(() => useRefresh());

    expect(result.current).toHaveProperty('isRefreshing');
    expect(result.current).toHaveProperty('refresh');
    expect(result.current).toHaveProperty('lastSyncedAt');
    expect(result.current).toHaveProperty('markSynced');
    expect(typeof result.current.refresh).toBe('function');
    expect(typeof result.current.markSynced).toBe('function');
  });

  it('should call router.refresh when refresh is invoked', () => {
    const { result } = renderHook(() => useRefresh());

    act(() => {
      result.current.refresh();
    });

    expect(mocks.mockRefresh).toHaveBeenCalled();
  });

  it('should initialise lastSyncedAt to roughly Date.now()', () => {
    const before = Date.now();
    const { result } = renderHook(() => useRefresh());
    const after = Date.now();

    expect(result.current.lastSyncedAt).toBeGreaterThanOrEqual(before);
    expect(result.current.lastSyncedAt).toBeLessThanOrEqual(after);
  });

  it('should update lastSyncedAt when refresh is called', () => {
    const { result } = renderHook(() => useRefresh());
    const initial = result.current.lastSyncedAt;

    // Advance time slightly so the timestamp differs
    vi.spyOn(Date, 'now').mockReturnValue(initial + 5_000);

    act(() => {
      result.current.refresh();
    });

    expect(result.current.lastSyncedAt).toBe(initial + 5_000);

    vi.restoreAllMocks();
  });

  it('should update lastSyncedAt when markSynced is called', () => {
    const { result } = renderHook(() => useRefresh());
    const initial = result.current.lastSyncedAt;

    vi.spyOn(Date, 'now').mockReturnValue(initial + 10_000);

    act(() => {
      result.current.markSynced();
    });

    expect(result.current.lastSyncedAt).toBe(initial + 10_000);

    vi.restoreAllMocks();
  });

  it('should not call router.refresh when markSynced is called', () => {
    mocks.mockRefresh.mockClear();

    const { result } = renderHook(() => useRefresh());

    act(() => {
      result.current.markSynced();
    });

    expect(mocks.mockRefresh).not.toHaveBeenCalled();
  });
});
