import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ACCENT_OPTIONS, DEFAULT_ACCENT, useAccent } from './use-accent';

const STORAGE_KEY = 'accent';
const ATTRIBUTE = 'data-accent';

describe('useAccent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(ATTRIBUTE);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(ATTRIBUTE);
  });

  // Test default state: hook should return default accent when localStorage is empty
  it('should return default accent when nothing is stored', () => {
    const { result } = renderHook(() => useAccent());

    expect(result.current.accent).toBe(DEFAULT_ACCENT);
  });

  // Test localStorage hydration: hook should pick up a previously stored accent
  it('should read stored accent from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'teal');

    const { result } = renderHook(() => useAccent());

    expect(result.current.accent).toBe('teal');
  });

  // Test fallback: invalid values in localStorage should fall back to default
  it('should fall back to default for invalid localStorage values', () => {
    localStorage.setItem(STORAGE_KEY, 'neon-pink');

    const { result } = renderHook(() => useAccent());

    expect(result.current.accent).toBe(DEFAULT_ACCENT);
  });

  // Test setAccent: should update state, localStorage, and DOM attribute
  it('should update accent state when setAccent is called', () => {
    const { result } = renderHook(() => useAccent());

    act(() => {
      result.current.setAccent('indigo');
    });

    expect(result.current.accent).toBe('indigo');
  });

  // Test localStorage persistence: setAccent should write to localStorage
  it('should persist accent to localStorage', () => {
    const { result } = renderHook(() => useAccent());

    act(() => {
      result.current.setAccent('teal');
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBe('teal');
  });

  // Test DOM attribute: setAccent should set data-accent on <html>
  it('should set data-accent attribute on document element', () => {
    const { result } = renderHook(() => useAccent());

    act(() => {
      result.current.setAccent('indigo');
    });

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('indigo');
  });

  // Test DOM sync on mount: useEffect should apply attribute for stored value
  it('should apply DOM attribute on mount via useEffect', () => {
    localStorage.setItem(STORAGE_KEY, 'teal');

    renderHook(() => useAccent());

    expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe('teal');
  });

  // Test sequential switching: cycling through all accents should work correctly
  it('should handle switching between all accent options', () => {
    const { result } = renderHook(() => useAccent());

    for (const accent of ACCENT_OPTIONS) {
      act(() => {
        result.current.setAccent(accent);
      });

      expect(result.current.accent).toBe(accent);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(accent);
      expect(document.documentElement.getAttribute(ATTRIBUTE)).toBe(accent);
    }
  });
});

describe('ACCENT_OPTIONS', () => {
  // Test constant integrity: options array should contain exactly the expected values
  it('should contain blue, teal, and indigo', () => {
    expect(ACCENT_OPTIONS).toEqual(['blue', 'teal', 'indigo']);
  });

  // Test default: DEFAULT_ACCENT should be the first option
  it('should have blue as the default accent', () => {
    expect(DEFAULT_ACCENT).toBe('blue');
    expect(ACCENT_OPTIONS).toContain(DEFAULT_ACCENT);
  });
});
