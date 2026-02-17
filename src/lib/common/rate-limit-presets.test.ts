/** Rate limit presets: configuration for common API patterns. */
import { describe, expect, it } from 'vitest';

import type { RateLimitPreset } from './rate-limit-presets';
import { RATE_LIMITS } from './rate-limit-presets';

const EXPECTED_KEYS = [
  'auth',
  'authStrict',
  'sensitive',
  'crud',
  'frequentSave',
  'respondentStart',
  'respondentSave',
  'respondentSubmit',
] as const;

describe('RATE_LIMITS', () => {
  it('should have limit and windowSeconds on each preset', () => {
    for (const preset of Object.values(RATE_LIMITS)) {
      expect(preset).toHaveProperty('limit');
      expect(preset).toHaveProperty('windowSeconds');
      expect(typeof (preset as RateLimitPreset).limit).toBe('number');
      expect(typeof (preset as RateLimitPreset).windowSeconds).toBe('number');
    }
  });

  it('should have positive limit and windowSeconds', () => {
    for (const preset of Object.values(RATE_LIMITS)) {
      expect((preset as RateLimitPreset).limit).toBeGreaterThan(0);
      expect((preset as RateLimitPreset).windowSeconds).toBeGreaterThan(0);
    }
  });

  it('should have expected preset keys', () => {
    for (const key of EXPECTED_KEYS) {
      expect(RATE_LIMITS).toHaveProperty(key);
    }
  });
});
