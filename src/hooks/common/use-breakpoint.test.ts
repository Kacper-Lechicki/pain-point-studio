import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BREAKPOINTS } from '@/config';

import { useBreakpoint } from './use-breakpoint';

describe('useBreakpoint', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
  });

  afterEach(() => {
    vi.stubGlobal('innerWidth', originalInnerWidth);
  });

  it('should return true when window width is above breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.lg + 100);
    const { result } = renderHook(() => useBreakpoint('lg'));

    expect(result.current).toBe(true);
  });

  it('should return true when window width equals breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.md);
    const { result } = renderHook(() => useBreakpoint('md'));

    expect(result.current).toBe(true);
  });

  it('should return false when window width is below breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.lg - 1);
    const { result } = renderHook(() => useBreakpoint('lg'));

    expect(result.current).toBe(false);
  });

  it('should update when window is resized', () => {
    vi.stubGlobal('innerWidth', 500);
    const { result } = renderHook(() => useBreakpoint('md'));

    expect(result.current).toBe(false);

    act(() => {
      vi.stubGlobal('innerWidth', BREAKPOINTS.md + 100);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useBreakpoint('sm'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
