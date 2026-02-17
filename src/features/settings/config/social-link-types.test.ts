/** Tests for the SOCIAL_LINK_TYPES config array and the derived SOCIAL_LINK_TYPE_VALUES tuple. */
import { describe, expect, it } from 'vitest';

import { SOCIAL_LINK_TYPES, SOCIAL_LINK_TYPE_VALUES } from './social-link-types';

// ── SOCIAL_LINK_TYPES ───────────────────────────────────────────────

describe('SOCIAL_LINK_TYPES', () => {
  it('should have value and labelKey for each entry', () => {
    for (const link of SOCIAL_LINK_TYPES) {
      expect(link).toHaveProperty('value');
      expect(link).toHaveProperty('labelKey');
      expect(typeof link.value).toBe('string');
      expect(typeof link.labelKey).toBe('string');
    }
  });

  it('should place other last', () => {
    const last = SOCIAL_LINK_TYPES[SOCIAL_LINK_TYPES.length - 1];
    expect(last?.value).toBe('other');
  });

  it('should follow settings.profile.socialLinks.labels.* format for labelKey', () => {
    for (const link of SOCIAL_LINK_TYPES) {
      expect(link.labelKey).toMatch(/^settings\.profile\.socialLinks\.labels\./);
    }
  });
});

// ── SOCIAL_LINK_TYPE_VALUES ───────────────────────────────────────────

describe('SOCIAL_LINK_TYPE_VALUES', () => {
  it('should be a mapping of SOCIAL_LINK_TYPES to value', () => {
    expect(SOCIAL_LINK_TYPE_VALUES).toHaveLength(SOCIAL_LINK_TYPES.length);
    expect(SOCIAL_LINK_TYPE_VALUES).toEqual(SOCIAL_LINK_TYPES.map((s) => s.value));
  });
});
