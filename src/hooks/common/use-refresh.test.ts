// @vitest-environment jsdom
/** useRefresh hook: triggers router refresh with success toast. */
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
  it('should return isRefreshing and refresh', () => {
    const { result } = renderHook(() => useRefresh());

    expect(result.current).toHaveProperty('isRefreshing');
    expect(result.current).toHaveProperty('refresh');
    expect(typeof result.current.refresh).toBe('function');
  });

  it('should call router.refresh and toast.success when refresh is invoked', () => {
    const { result } = renderHook(() => useRefresh());

    act(() => {
      result.current.refresh();
    });

    expect(mocks.mockRefresh).toHaveBeenCalled();
    expect(mocks.mockSuccess).toHaveBeenCalledWith('common.dataRefreshed');
  });
});
