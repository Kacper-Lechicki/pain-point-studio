/** useSessionState hook: useState with sessionStorage persistence. */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionState } from './use-session-state';

const KEY = 'test-key';

describe('useSessionState', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Returns default when nothing stored.
  it('should return defaultValue when sessionStorage is empty', () => {
    const { result } = renderHook(() => useSessionState(KEY, 42));
    expect(result.current[0]).toBe(42);
  });

  // Hydrates from sessionStorage if a value is stored.
  it('should hydrate from sessionStorage', () => {
    sessionStorage.setItem(KEY, JSON.stringify('stored-value'));

    const { result } = renderHook(() => useSessionState(KEY, 'default'));

    expect(result.current[0]).toBe('stored-value');
  });

  // setState updates both state and sessionStorage.
  it('should persist value to sessionStorage on setState', () => {
    const { result } = renderHook(() => useSessionState(KEY, 'default'));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify('new-value'));
  });

  // Setting value back to defaultValue removes the key from storage.
  it('should remove key from sessionStorage when set to defaultValue', () => {
    const { result } = renderHook(() => useSessionState(KEY, 'default'));

    act(() => {
      result.current[1]('something');
    });

    expect(sessionStorage.getItem(KEY)).toBe(JSON.stringify('something'));

    act(() => {
      result.current[1]('default');
    });

    expect(result.current[0]).toBe('default');
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  // Works with objects.
  it('should handle object values', () => {
    const defaultVal = { page: 1, sort: 'asc' };
    const { result } = renderHook(() => useSessionState(KEY, defaultVal));

    act(() => {
      result.current[1]({ page: 2, sort: 'desc' });
    });

    expect(result.current[0]).toEqual({ page: 2, sort: 'desc' });
    expect(JSON.parse(sessionStorage.getItem(KEY)!)).toEqual({ page: 2, sort: 'desc' });
  });

  // Gracefully handles corrupt data in sessionStorage.
  it('should fall back to defaultValue when stored data is corrupt', () => {
    sessionStorage.setItem(KEY, 'not-valid-json{{{');

    const { result } = renderHook(() => useSessionState(KEY, 'fallback'));

    expect(result.current[0]).toBe('fallback');
  });

  // Gracefully handles sessionStorage quota exceeded.
  it('should not throw when sessionStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useSessionState(KEY, 0));

    expect(() => {
      act(() => {
        result.current[1](999);
      });
    }).not.toThrow();

    // State still updates in memory even though storage failed.
    expect(result.current[0]).toBe(999);

    vi.restoreAllMocks();
  });
});
