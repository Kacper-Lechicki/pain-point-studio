/** BREAKPOINTS config: ordering and value constraints. */
import { describe, expect, it } from 'vitest';

import { BREAKPOINTS } from './breakpoints';

// ── BREAKPOINTS ──────────────────────────────────────────────────────

describe('BREAKPOINTS', () => {
  it('should have sm less than md', () => {
    expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
  });

  it('should have md less than lg', () => {
    expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg);
  });

  it('should have lg less than xl', () => {
    expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl);
  });

  it('should have xl less than 2xl', () => {
    expect(BREAKPOINTS.xl).toBeLessThan(BREAKPOINTS['2xl']);
  });

  it('should have dashboard breakpoint between lg and 2xl', () => {
    expect(BREAKPOINTS.dashboard).toBeGreaterThanOrEqual(BREAKPOINTS.lg);
    expect(BREAKPOINTS.dashboard).toBeLessThanOrEqual(BREAKPOINTS['2xl']);
  });

  it('should have all values as positive numbers', () => {
    for (const value of Object.values(BREAKPOINTS)) {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
