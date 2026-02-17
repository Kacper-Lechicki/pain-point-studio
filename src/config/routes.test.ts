/** Route config: ROUTES groups, SIBLING_GROUPS, and settings section round-trip. */
import { describe, expect, it } from 'vitest';

import {
  HASH_TO_SECTION,
  ROUTES,
  SECTION_TO_HASH,
  SETTINGS_SECTION_VALUES,
  SIBLING_GROUPS,
} from './routes';

// ── ROUTES ───────────────────────────────────────────────────────────

describe('ROUTES', () => {
  it('should have auth group with expected keys', () => {
    expect(ROUTES.auth).toBeDefined();
    expect(ROUTES.auth).toHaveProperty('signIn');
    expect(ROUTES.auth).toHaveProperty('signUp');
    expect(ROUTES.auth).toHaveProperty('forgotPassword');
    expect(ROUTES.auth).toHaveProperty('callback');
  });

  it('should have common group with home, dashboard, settings', () => {
    expect(ROUTES.common).toHaveProperty('home');
    expect(ROUTES.common).toHaveProperty('dashboard');
    expect(ROUTES.common).toHaveProperty('settings');
  });

  it('should have settings group with profile and dangerZone', () => {
    expect(ROUTES.settings).toHaveProperty('profile');
    expect(ROUTES.settings).toHaveProperty('dangerZone');
  });

  it('should have dashboard group with surveys and analytics', () => {
    expect(ROUTES.dashboard).toHaveProperty('surveys');
    expect(ROUTES.dashboard).toHaveProperty('analytics');
  });

  it('should have all route values as strings', () => {
    expect(typeof ROUTES.common.home).toBe('string');
    expect(typeof ROUTES.auth.signIn).toBe('string');
  });
});

// ── SIBLING_GROUPS ───────────────────────────────────────────────────

describe('SIBLING_GROUPS', () => {
  it('should be a non-empty array', () => {
    expect(Array.isArray(SIBLING_GROUPS)).toBe(true);
    expect(SIBLING_GROUPS.length).toBeGreaterThan(0);
  });

  it('should have each group as an array of routes', () => {
    for (const group of SIBLING_GROUPS) {
      expect(Array.isArray(group)).toBe(true);
      expect(group.length).toBeGreaterThan(0);
    }
  });
});

// ── SETTINGS_SECTION_VALUES and SECTION_TO_HASH / HASH_TO_SECTION ───

describe('settings section round-trip', () => {
  it('should have expected SETTINGS_SECTION_VALUES entries', () => {
    expect(SETTINGS_SECTION_VALUES).toContain('profile');
    expect(SETTINGS_SECTION_VALUES).toContain('dangerZone');
  });

  it('should map each section to a hash string in SECTION_TO_HASH', () => {
    for (const section of SETTINGS_SECTION_VALUES) {
      expect(SECTION_TO_HASH[section]).toBeDefined();
      expect(typeof SECTION_TO_HASH[section]).toBe('string');
    }
  });

  it('should round-trip section → hash → section to original value', () => {
    for (const section of SETTINGS_SECTION_VALUES) {
      const hash = SECTION_TO_HASH[section];
      expect(HASH_TO_SECTION[hash]).toBe(section);
    }
  });

  it('should have HASH_TO_SECTION entry for each SECTION_TO_HASH value', () => {
    for (const hash of Object.values(SECTION_TO_HASH)) {
      expect(HASH_TO_SECTION[hash]).toBeDefined();
    }
  });
});
