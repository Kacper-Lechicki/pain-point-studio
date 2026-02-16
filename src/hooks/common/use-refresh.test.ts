// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useRefresh } from './use-refresh';

const mocks = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
  mockSuccess: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.mockRefresh }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.mockSuccess },
}));

// ── useRefresh ───────────────────────────────────────────────────────

describe('useRefresh', () => {
  // Hook returns isRefreshing and refresh function.
  it('returns isRefreshing and refresh', () => {
    const { result } = renderHook(() => useRefresh());

    expect(result.current).toHaveProperty('isRefreshing');
    expect(result.current).toHaveProperty('refresh');
    expect(typeof result.current.refresh).toBe('function');
  });

  // Invoking refresh calls router.refresh and toast.success(common.dataRefreshed).
  it('calls router.refresh and toast.success when refresh is invoked', () => {
    const { result } = renderHook(() => useRefresh());

    act(() => {
      result.current.refresh();
    });

    expect(mocks.mockRefresh).toHaveBeenCalled();
    expect(mocks.mockSuccess).toHaveBeenCalledWith('common.dataRefreshed');
  });
});
