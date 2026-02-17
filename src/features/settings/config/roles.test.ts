/** Tests for the ROLES config array and the derived ROLE_VALUES tuple. */
import { describe, expect, it } from 'vitest';

import { ROLES, ROLE_VALUES } from './roles';

// ── ROLES ───────────────────────────────────────────────────────────

describe('ROLES', () => {
  it('should have value and labelKey for each entry', () => {
    for (const role of ROLES) {
      expect(role).toHaveProperty('value');
      expect(role).toHaveProperty('labelKey');
      expect(typeof role.value).toBe('string');
      expect(typeof role.labelKey).toBe('string');
    }
  });

  it('should place other last', () => {
    const last = ROLES[ROLES.length - 1];
    expect(last?.value).toBe('other');
  });

  it('should follow settings.roles.* format for labelKey', () => {
    for (const role of ROLES) {
      expect(role.labelKey).toMatch(/^settings\.roles\./);
    }
  });
});

// ── ROLE_VALUES ──────────────────────────────────────────────────────

describe('ROLE_VALUES', () => {
  it('should be a mapping of ROLES to value', () => {
    expect(ROLE_VALUES).toHaveLength(ROLES.length);
    expect(ROLE_VALUES).toEqual(ROLES.map((r) => r.value));
  });
});
