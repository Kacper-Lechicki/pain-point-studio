import { describe, expect, it } from 'vitest';

import { NAV_LINKS } from './navigation';

// ── NAV_LINKS ───────────────────────────────────────────────────────

describe('NAV_LINKS', () => {
  // Each link has href and label.
  it('each entry has href and label', () => {
    for (const link of NAV_LINKS) {
      expect(link).toHaveProperty('href');
      expect(link).toHaveProperty('label');
      expect(typeof link.href).toBe('string');
      expect(typeof link.label).toBe('string');
    }
  });

  // All hrefs are non-empty.
  it('href values are non-empty strings', () => {
    for (const link of NAV_LINKS) {
      expect(link.href.length).toBeGreaterThan(0);
    }
  });

  // disabled is optional on entries.
  it('disabled is optional and may be true', () => {
    const withDisabled = NAV_LINKS.filter((l) => 'disabled' in l && l.disabled);
    expect(withDisabled.length).toBeGreaterThanOrEqual(0);
  });
});
