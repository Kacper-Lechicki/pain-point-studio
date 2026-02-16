import { describe, expect, it } from 'vitest';

import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_SIZE,
  AVATAR_OUTPUT_SIZE,
  BIO_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  MAX_SOCIAL_LINKS,
} from './constraints';
import { ROLES, ROLE_VALUES } from './roles';
import { SOCIAL_LINK_TYPES, SOCIAL_LINK_TYPE_VALUES } from './social-link-types';

// ── Profile constraints ─────────────────────────────────────────────

describe('profile constraints', () => {
  it('FULL_NAME_MAX_LENGTH is a positive number', () => {
    expect(FULL_NAME_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('BIO_MAX_LENGTH is a positive number', () => {
    expect(BIO_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('MAX_SOCIAL_LINKS is a positive number', () => {
    expect(MAX_SOCIAL_LINKS).toBeGreaterThan(0);
  });
});

// ── Avatar constraints ──────────────────────────────────────────────

describe('avatar constraints', () => {
  it('AVATAR_MAX_SIZE is 5 MB', () => {
    expect(AVATAR_MAX_SIZE).toBe(5 * 1024 * 1024);
  });

  it('AVATAR_ACCEPTED_TYPES includes common image formats', () => {
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/jpeg');
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/png');
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/webp');
  });

  it('AVATAR_OUTPUT_SIZE is a positive number', () => {
    expect(AVATAR_OUTPUT_SIZE).toBeGreaterThan(0);
  });
});

// ── Roles config ────────────────────────────────────────────────────

describe('ROLES', () => {
  it('has at least one role', () => {
    expect(ROLES.length).toBeGreaterThan(0);
  });

  it('every role has a value and labelKey', () => {
    for (const role of ROLES) {
      expect(role.value).toBeTruthy();
      expect(role.labelKey).toBeTruthy();
    }
  });

  it('ROLE_VALUES matches ROLES values', () => {
    expect(ROLE_VALUES).toEqual(ROLES.map((r) => r.value));
  });

  it('has no duplicate values', () => {
    const unique = new Set(ROLE_VALUES);

    expect(unique.size).toBe(ROLE_VALUES.length);
  });
});

// ── Social link types config ────────────────────────────────────────

describe('SOCIAL_LINK_TYPES', () => {
  it('has at least one type', () => {
    expect(SOCIAL_LINK_TYPES.length).toBeGreaterThan(0);
  });

  it('every type has a value and labelKey', () => {
    for (const type of SOCIAL_LINK_TYPES) {
      expect(type.value).toBeTruthy();
      expect(type.labelKey).toBeTruthy();
    }
  });

  it('SOCIAL_LINK_TYPE_VALUES matches SOCIAL_LINK_TYPES values', () => {
    expect(SOCIAL_LINK_TYPE_VALUES).toEqual(SOCIAL_LINK_TYPES.map((s) => s.value));
  });

  it('has no duplicate values', () => {
    const unique = new Set(SOCIAL_LINK_TYPE_VALUES);

    expect(unique.size).toBe(SOCIAL_LINK_TYPE_VALUES.length);
  });
});
