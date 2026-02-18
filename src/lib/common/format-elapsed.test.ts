import { describe, expect, it, vi } from 'vitest';

import { formatElapsed } from './format-elapsed';

const t = vi.fn((key: string, params?: Record<string, number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key
);

describe('formatElapsed', () => {
  it('returns justNow for 0 ms', () => {
    expect(formatElapsed(0, t)).toBe('justNow');
  });

  it('returns justNow for values below the tick threshold', () => {
    expect(formatElapsed(29_000, t)).toBe('justNow');
  });

  it('returns seconds for 30–59 s', () => {
    expect(formatElapsed(30_000, t)).toBe('secondsAgo:{"seconds":30}');
    expect(formatElapsed(45_000, t)).toBe('secondsAgo:{"seconds":45}');
  });

  it('returns minutes for 60 s – 59 min', () => {
    expect(formatElapsed(60_000, t)).toBe('minutesAgo:{"minutes":1}');
    expect(formatElapsed(5 * 60_000, t)).toBe('minutesAgo:{"minutes":5}');
    expect(formatElapsed(59 * 60_000, t)).toBe('minutesAgo:{"minutes":59}');
  });

  it('returns hours for 60+ min', () => {
    expect(formatElapsed(60 * 60_000, t)).toBe('hoursAgo:{"hours":1}');
    expect(formatElapsed(3 * 60 * 60_000, t)).toBe('hoursAgo:{"hours":3}');
  });
});
