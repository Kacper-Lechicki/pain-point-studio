// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCommandPalette } from './use-command-palette';

function fireKeyDown(key: string, opts: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

describe('useCommandPalette', () => {
  it('starts with open=false', () => {
    const { result } = renderHook(() => useCommandPalette());

    expect(result.current.open).toBe(false);
  });

  it('toggles open on Cmd+K', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => fireKeyDown('k', { metaKey: true }));

    expect(result.current.open).toBe(true);

    act(() => fireKeyDown('k', { metaKey: true }));

    expect(result.current.open).toBe(false);
  });

  it('toggles open on Ctrl+K', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => fireKeyDown('k', { ctrlKey: true }));

    expect(result.current.open).toBe(true);
  });

  it('does not toggle on plain K key', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => fireKeyDown('k'));

    expect(result.current.open).toBe(false);
  });

  it('does not toggle on other Cmd+key combos', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => fireKeyDown('j', { metaKey: true }));

    expect(result.current.open).toBe(false);
  });

  it('setOpen changes the state directly', () => {
    const { result } = renderHook(() => useCommandPalette());

    act(() => result.current.setOpen(true));

    expect(result.current.open).toBe(true);

    act(() => result.current.setOpen(false));

    expect(result.current.open).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const { result, unmount } = renderHook(() => useCommandPalette());

    unmount();

    // After unmount, keyboard events should have no effect
    act(() => fireKeyDown('k', { metaKey: true }));

    expect(result.current.open).toBe(false);
  });
});
