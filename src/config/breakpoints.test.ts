import { describe, expect, it } from 'vitest';

import { BREAKPOINTS } from './breakpoints';

// ── BREAKPOINTS ──────────────────────────────────────────────────────

describe('BREAKPOINTS', () => {
  // Breakpoints increase in order: sm < md.
  it('sm is less than md', () => {
    expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
  });

  // md < lg.
  it('md is less than lg', () => {
    expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg);
  });

  // lg < xl.
  it('lg is less than xl', () => {
    expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl);
  });

  // xl < 2xl.
  it('xl is less than 2xl', () => {
    expect(BREAKPOINTS.xl).toBeLessThan(BREAKPOINTS['2xl']);
  });

  // Dashboard breakpoint lies between lg and 2xl.
  it('dashboard breakpoint is between lg and 2xl', () => {
    expect(BREAKPOINTS.dashboard).toBeGreaterThanOrEqual(BREAKPOINTS.lg);
    expect(BREAKPOINTS.dashboard).toBeLessThanOrEqual(BREAKPOINTS['2xl']);
  });

  // All breakpoint values are positive integers.
  it('all values are positive numbers', () => {
    for (const value of Object.values(BREAKPOINTS)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
