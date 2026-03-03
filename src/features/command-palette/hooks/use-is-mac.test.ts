// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIsMac } from './use-is-mac';

describe('useIsMac', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.stubGlobal('queueMicrotask', (cb: () => void) => cb());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
  });

  it('returns true when userAgentData.platform is macOS', async () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgentData: { platform: 'macOS' },
        userAgent: '',
      },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns true when userAgent contains Mac (fallback)', async () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false for non-Mac platforms', async () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgentData: { platform: 'Windows' },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      writable: true,
    });

    const { result } = renderHook(() => useIsMac());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
