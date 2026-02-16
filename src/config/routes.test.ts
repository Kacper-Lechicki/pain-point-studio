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
  // Auth group exposes signIn, signUp, forgotPassword, callback.
  it('has auth group with expected keys', () => {
    expect(ROUTES.auth).toBeDefined();
    expect(ROUTES.auth).toHaveProperty('signIn');
    expect(ROUTES.auth).toHaveProperty('signUp');
    expect(ROUTES.auth).toHaveProperty('forgotPassword');
    expect(ROUTES.auth).toHaveProperty('callback');
  });

  // Common group has home, dashboard, settings.
  it('has common group with home, dashboard, settings', () => {
    expect(ROUTES.common).toHaveProperty('home');
    expect(ROUTES.common).toHaveProperty('dashboard');
    expect(ROUTES.common).toHaveProperty('settings');
  });

  // Settings group has profile and dangerZone.
  it('has settings group with profile and dangerZone', () => {
    expect(ROUTES.settings).toHaveProperty('profile');
    expect(ROUTES.settings).toHaveProperty('dangerZone');
  });

  // Dashboard group has surveys and analytics.
  it('has dashboard group with surveys and analytics', () => {
    expect(ROUTES.dashboard).toHaveProperty('surveys');
    expect(ROUTES.dashboard).toHaveProperty('analytics');
  });

  // All exposed route values are strings.
  it('all route values are strings', () => {
    expect(typeof ROUTES.common.home).toBe('string');
    expect(typeof ROUTES.auth.signIn).toBe('string');
  });
});

// ── SIBLING_GROUPS ───────────────────────────────────────────────────

describe('SIBLING_GROUPS', () => {
  // SIBLING_GROUPS is a non-empty array.
  it('is a non-empty array', () => {
    expect(Array.isArray(SIBLING_GROUPS)).toBe(true);
    expect(SIBLING_GROUPS.length).toBeGreaterThan(0);
  });

  // Each element is an array of route strings.
  it('each group is an array of routes', () => {
    for (const group of SIBLING_GROUPS) {
      expect(Array.isArray(group)).toBe(true);
      expect(group.length).toBeGreaterThan(0);
    }
  });
});

// ── SETTINGS_SECTION_VALUES and SECTION_TO_HASH / HASH_TO_SECTION ───

describe('settings section round-trip', () => {
  // SETTINGS_SECTION_VALUES includes profile and dangerZone.
  it('SETTINGS_SECTION_VALUES has expected entries', () => {
    expect(SETTINGS_SECTION_VALUES).toContain('profile');
    expect(SETTINGS_SECTION_VALUES).toContain('dangerZone');
  });

  // Each section maps to a defined hash string.
  it('SECTION_TO_HASH maps each section to a hash string', () => {
    for (const section of SETTINGS_SECTION_VALUES) {
      expect(SECTION_TO_HASH[section]).toBeDefined();
      expect(typeof SECTION_TO_HASH[section]).toBe('string');
    }
  });

  // Round-trip section → hash → section yields original section.
  it('round-trip section → hash → section returns original section', () => {
    for (const section of SETTINGS_SECTION_VALUES) {
      const hash = SECTION_TO_HASH[section];
      expect(HASH_TO_SECTION[hash]).toBe(section);
    }
  });

  // Every SECTION_TO_HASH value has a HASH_TO_SECTION entry.
  it('HASH_TO_SECTION has entry for each SECTION_TO_HASH value', () => {
    for (const hash of Object.values(SECTION_TO_HASH)) {
      expect(HASH_TO_SECTION[hash]).toBeDefined();
    }
  });
});
