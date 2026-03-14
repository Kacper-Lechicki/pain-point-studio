// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { AUTH_PROVIDERS, authProviderSchema } from './auth-provider';

// ── AUTH_PROVIDERS ───────────────────────────────────────────────────

describe('AUTH_PROVIDERS', () => {
  it('contains google and github', () => {
    expect(AUTH_PROVIDERS).toEqual(['google', 'github']);
  });

  it('has exactly 2 entries', () => {
    expect(AUTH_PROVIDERS).toHaveLength(2);
  });
});

// ── authProviderSchema ──────────────────────────────────────────────

describe('authProviderSchema', () => {
  it('accepts google', () => {
    expect(authProviderSchema.safeParse('google').success).toBe(true);
  });

  it('accepts github', () => {
    expect(authProviderSchema.safeParse('github').success).toBe(true);
  });

  it('rejects invalid provider', () => {
    expect(authProviderSchema.safeParse('facebook').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(authProviderSchema.safeParse('').success).toBe(false);
  });
});
