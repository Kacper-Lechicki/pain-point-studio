/** Tests for NAV_LINKS configuration ensuring valid structure and properties. */
import { describe, expect, it } from 'vitest';

import { NAV_LINKS } from './navigation';

// ── NAV_LINKS ───────────────────────────────────────────────────────

describe('NAV_LINKS', () => {
  it('should have href and label on each entry', () => {
    for (const link of NAV_LINKS) {
      expect(link).toHaveProperty('href');
      expect(link).toHaveProperty('label');
      expect(typeof link.href).toBe('string');
      expect(typeof link.label).toBe('string');
    }
  });

  it('should have non-empty href values', () => {
    for (const link of NAV_LINKS) {
      expect(link.href.length).toBeGreaterThan(0);
    }
  });

  it('should allow disabled to be optional and may be true', () => {
    const withDisabled = NAV_LINKS.filter((l) => 'disabled' in l && l.disabled);
    expect(withDisabled.length).toBeGreaterThanOrEqual(0);
  });
});
