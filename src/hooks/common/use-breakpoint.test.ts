import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BREAKPOINTS } from '@/config/breakpoints';

import { useBreakpoint, useWindowSize } from './use-breakpoint';

describe('useBreakpoint', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
  });

  afterEach(() => {
    vi.stubGlobal('innerWidth', originalInnerWidth);
  });

  // Test if hook returns true when viewport exceeds the breakpoint threshold
  it('should return true when window width is above breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.lg + 100);
    const { result } = renderHook(() => useBreakpoint('lg'));

    expect(result.current).toBe(true);
  });

  // Test edge case: viewport width exactly matches breakpoint value (should be inclusive)
  it('should return true when window width equals breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.md);
    const { result } = renderHook(() => useBreakpoint('md'));

    expect(result.current).toBe(true);
  });

  // Test if hook correctly detects when viewport is below the breakpoint
  it('should return false when window width is below breakpoint', () => {
    vi.stubGlobal('innerWidth', BREAKPOINTS.lg - 1);
    const { result } = renderHook(() => useBreakpoint('lg'));

    expect(result.current).toBe(false);
  });

  // Test reactive behavior: hook should update when window resize event fires
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

  // Test cleanup: ensure event listener is removed on component unmount to prevent memory leaks
  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useBreakpoint('sm'));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});

describe('useWindowSize', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    vi.stubGlobal('innerWidth', 1024);
    vi.stubGlobal('innerHeight', 768);
  });

  afterEach(() => {
    vi.stubGlobal('innerWidth', originalInnerWidth);
    vi.stubGlobal('innerHeight', originalInnerHeight);
  });

  // Test initial state: hook should return current window dimensions on mount
  it('should return current window dimensions', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  // Test reactive behavior: both width and height should update on resize
  it('should update dimensions on resize', () => {
    const { result } = renderHook(() => useWindowSize());

    act(() => {
      vi.stubGlobal('innerWidth', 1280);
      vi.stubGlobal('innerHeight', 900);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.width).toBe(1280);
    expect(result.current.height).toBe(900);
  });

  // Test cleanup: ensure event listener is removed on component unmount to prevent memory leaks
  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
