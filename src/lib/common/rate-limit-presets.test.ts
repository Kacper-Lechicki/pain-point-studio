import { describe, expect, it } from 'vitest';

import type { RateLimitPreset } from './rate-limit-presets';
import { RATE_LIMITS } from './rate-limit-presets';

// ── RATE_LIMITS ──────────────────────────────────────────────────────

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
  // Every preset has limit and windowSeconds.
  it('each preset has limit and windowSeconds', () => {
    for (const preset of Object.values(RATE_LIMITS)) {
      expect(preset).toHaveProperty('limit');
      expect(preset).toHaveProperty('windowSeconds');
      expect(typeof (preset as RateLimitPreset).limit).toBe('number');
      expect(typeof (preset as RateLimitPreset).windowSeconds).toBe('number');
    }
  });

  // limit and windowSeconds are > 0.
  it('limit and windowSeconds are positive', () => {
    for (const preset of Object.values(RATE_LIMITS)) {
      expect((preset as RateLimitPreset).limit).toBeGreaterThan(0);
      expect((preset as RateLimitPreset).windowSeconds).toBeGreaterThan(0);
    }
  });

  // Preset keys auth, crud, respondentSubmit etc. exist.
  it('has expected preset keys', () => {
    for (const key of EXPECTED_KEYS) {
      expect(RATE_LIMITS).toHaveProperty(key);
    }
  });
});
