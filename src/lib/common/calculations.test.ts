import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { daysUntilExpiry } from './calculations';

// ── daysUntilExpiry ─────────────────────────────────────────────────

describe('daysUntilExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return remaining days when not expired', () => {
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    // Archived 10 days ago, 14-day limit → 4 days left
    const result = daysUntilExpiry('2024-12-22T00:00:00Z', 14);

    expect(result).toBe(4);
  });

  it('should return null when expired', () => {
    vi.setSystemTime(new Date('2025-01-16T00:00:00Z'));

    // Archived 15 days ago, 14-day limit → expired
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 14);

    expect(result).toBeNull();
  });

  it('should return null when timestampAt is null', () => {
    expect(daysUntilExpiry(null, 14)).toBeNull();
  });

  it('should return null when timestampAt is undefined', () => {
    expect(daysUntilExpiry(undefined, 14)).toBeNull();
  });

  it('should return 1 on the last day before expiry', () => {
    vi.setSystemTime(new Date('2025-01-14T12:00:00Z'));

    // Archived exactly 13 days ago, 14-day limit → 1 day left
    const result = daysUntilExpiry('2025-01-01T00:00:00Z', 14);

    expect(result).toBe(1);
  });
});
