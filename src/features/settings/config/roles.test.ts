import { describe, expect, it } from 'vitest';

import { ROLES, ROLE_VALUES } from './roles';

// ── ROLES ───────────────────────────────────────────────────────────

describe('ROLES', () => {
  // Each role has value and labelKey strings.
  it('each entry has value and labelKey', () => {
    for (const role of ROLES) {
      expect(role).toHaveProperty('value');
      expect(role).toHaveProperty('labelKey');
      expect(typeof role.value).toBe('string');
      expect(typeof role.labelKey).toBe('string');
    }
  });

  // "other" is the last role.
  it('other is last', () => {
    const last = ROLES[ROLES.length - 1];
    expect(last?.value).toBe('other');
  });

  // labelKey matches settings.roles.*.
  it('labelKey follows settings.roles.* format', () => {
    for (const role of ROLES) {
      expect(role.labelKey).toMatch(/^settings\.roles\./);
    }
  });
});

// ── ROLE_VALUES ──────────────────────────────────────────────────────

describe('ROLE_VALUES', () => {
  // ROLE_VALUES equals ROLES.map(r => r.value).
  it('is mapping of ROLES to value', () => {
    expect(ROLE_VALUES).toHaveLength(ROLES.length);
    expect(ROLE_VALUES).toEqual(ROLES.map((r) => r.value));
  });
});
