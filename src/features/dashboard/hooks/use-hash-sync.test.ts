// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getHash, useHashSync } from './use-hash-sync';

// ── getHash ───────────────────────────────────────────────────────────

describe('getHash', () => {
  // Returns hash string without leading #.
  it('returns value without leading # when window.location.hash is set', () => {
    const originalHash = window.location.hash;
    window.location.hash = '#section-one';

    expect(getHash()).toBe('section-one');

    window.location.hash = originalHash;
  });

  // Empty hash → ''.
  it('returns empty string when hash is empty', () => {
    const originalHash = window.location.hash;
    window.location.hash = '';

    expect(getHash()).toBe('');

    window.location.hash = originalHash;
  });
});

// ── useHashSync ───────────────────────────────────────────────────────

describe('useHashSync', () => {
  // Dispatching hashchange updates returned hash state.
  it('updates returned hash when hashchange is dispatched', () => {
    const originalHash = window.location.hash;
    window.location.hash = '#profile';

    const { result } = renderHook(() => useHashSync());

    act(() => {
      window.location.hash = '#email';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current).toBe('email');

    window.location.hash = originalHash;
  });
});
