/** Tests for profile, avatar, roles, and social-link-type constraint constants. */
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
  it('should define FULL_NAME_MAX_LENGTH as a positive number', () => {
    expect(FULL_NAME_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('should define BIO_MAX_LENGTH as a positive number', () => {
    expect(BIO_MAX_LENGTH).toBeGreaterThan(0);
  });

  it('should define MAX_SOCIAL_LINKS as a positive number', () => {
    expect(MAX_SOCIAL_LINKS).toBeGreaterThan(0);
  });
});

// ── Avatar constraints ──────────────────────────────────────────────

describe('avatar constraints', () => {
  it('should set AVATAR_MAX_SIZE to 5 MB', () => {
    expect(AVATAR_MAX_SIZE).toBe(5 * 1024 * 1024);
  });

  it('should include common image formats in AVATAR_ACCEPTED_TYPES', () => {
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/jpeg');
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/png');
    expect(AVATAR_ACCEPTED_TYPES).toContain('image/webp');
  });

  it('should define AVATAR_OUTPUT_SIZE as a positive number', () => {
    expect(AVATAR_OUTPUT_SIZE).toBeGreaterThan(0);
  });
});

// ── Roles config ────────────────────────────────────────────────────

describe('ROLES', () => {
  it('should have at least one role', () => {
    expect(ROLES.length).toBeGreaterThan(0);
  });

  it('should have a value and labelKey for every role', () => {
    for (const role of ROLES) {
      expect(role.value).toBeTruthy();
      expect(role.labelKey).toBeTruthy();
    }
  });

  it('should match ROLES values in ROLE_VALUES', () => {
    expect(ROLE_VALUES).toEqual(ROLES.map((r) => r.value));
  });

  it('should have no duplicate values', () => {
    const unique = new Set(ROLE_VALUES);

    expect(unique.size).toBe(ROLE_VALUES.length);
  });
});

// ── Social link types config ────────────────────────────────────────

describe('SOCIAL_LINK_TYPES', () => {
  it('should have at least one type', () => {
    expect(SOCIAL_LINK_TYPES.length).toBeGreaterThan(0);
  });

  it('should have a value and labelKey for every type', () => {
    for (const type of SOCIAL_LINK_TYPES) {
      expect(type.value).toBeTruthy();
      expect(type.labelKey).toBeTruthy();
    }
  });

  it('should match SOCIAL_LINK_TYPES values in SOCIAL_LINK_TYPE_VALUES', () => {
    expect(SOCIAL_LINK_TYPE_VALUES).toEqual(SOCIAL_LINK_TYPES.map((s) => s.value));
  });

  it('should have no duplicate values', () => {
    const unique = new Set(SOCIAL_LINK_TYPE_VALUES);

    expect(unique.size).toBe(SOCIAL_LINK_TYPE_VALUES.length);
  });
});
