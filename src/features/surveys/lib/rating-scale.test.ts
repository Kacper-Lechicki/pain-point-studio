import { describe, expect, it } from 'vitest';

import { getRatingScaleConfig } from './rating-scale';

describe('getRatingScaleConfig', () => {
  it('returns defaults for empty config', () => {
    const result = getRatingScaleConfig({});

    expect(result).toEqual({
      min: 1,
      max: 5,
      values: [1, 2, 3, 4, 5],
      minLabel: '',
      maxLabel: '',
    });
  });

  it('parses custom min/max', () => {
    const result = getRatingScaleConfig({ min: 0, max: 10 });

    expect(result.min).toBe(0);
    expect(result.max).toBe(10);
    expect(result.values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('parses labels', () => {
    const result = getRatingScaleConfig({
      min: 1,
      max: 5,
      minLabel: 'Bad',
      maxLabel: 'Great',
    });

    expect(result.minLabel).toBe('Bad');
    expect(result.maxLabel).toBe('Great');
  });

  it('handles partial config with only min', () => {
    const result = getRatingScaleConfig({ min: 3 });

    expect(result.min).toBe(3);
    expect(result.max).toBe(5);
    expect(result.values).toEqual([3, 4, 5]);
  });

  it('handles single-value range where min equals max', () => {
    const result = getRatingScaleConfig({ min: 5, max: 5 });

    expect(result.values).toEqual([5]);
  });
});
