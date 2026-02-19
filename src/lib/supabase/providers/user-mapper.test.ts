/** Tests for the Supabase User -> AppUser mapper that decouples app code from Supabase types. */
import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import { mapSupabaseUser } from './user-mapper';

// ── Helpers ────────────────────────────────────────────────────────

/** Minimal Supabase User with only the fields the mapper reads. */
function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    user_metadata: { display_name: 'Test' },
    identities: [],
    ...overrides,
  } as unknown as User;
}

describe('mapSupabaseUser', () => {
  it('should map basic fields (id, email, createdAt, userMetadata)', () => {
    const result = mapSupabaseUser(fakeUser());

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      userMetadata: { display_name: 'Test' },
      identities: [],
    });
  });

  it('should default email to empty string when undefined', () => {
    const userWithNoEmail = { ...fakeUser(), email: undefined };
    const result = mapSupabaseUser(userWithNoEmail as unknown as User);

    expect(result.email).toBe('');
  });

  it('should default createdAt to empty string when undefined', () => {
    const result = mapSupabaseUser(fakeUser({ created_at: undefined as unknown as string }));

    expect(result.createdAt).toBe('');
  });

  it('should default userMetadata to empty object when undefined', () => {
    const result = mapSupabaseUser(
      fakeUser({ user_metadata: undefined as unknown as User['user_metadata'] })
    );

    expect(result.userMetadata).toEqual({});
  });

  it('should map identities — renaming identity_id to identityId and extracting email', () => {
    const result = mapSupabaseUser(
      fakeUser({
        identities: [
          {
            identity_id: 'id-1',
            provider: 'google',
            identity_data: { email: 'google@example.com', name: 'Test' },
          },
        ],
      } as unknown as Partial<User>)
    );

    expect(result.identities).toEqual([
      {
        identityId: 'id-1',
        provider: 'google',
        email: 'google@example.com',
        identityData: { email: 'google@example.com', name: 'Test' },
      },
    ]);
  });

  it('should handle user with null identities', () => {
    const result = mapSupabaseUser(fakeUser({ identities: null } as unknown as Partial<User>));

    expect(result.identities).toEqual([]);
  });

  it('should handle user with undefined identities', () => {
    const result = mapSupabaseUser(fakeUser({ identities: undefined } as unknown as Partial<User>));

    expect(result.identities).toEqual([]);
  });

  it('should NOT include email or identityData keys when identity_data is undefined', () => {
    const result = mapSupabaseUser(
      fakeUser({
        identities: [
          {
            identity_id: 'id-1',
            provider: 'email',
            identity_data: undefined,
          },
        ],
      } as unknown as Partial<User>)
    );

    expect(result.identities).toEqual([{ identityId: 'id-1', provider: 'email' }]);
    expect(result.identities[0]).not.toHaveProperty('email');
    expect(result.identities[0]).not.toHaveProperty('identityData');
  });

  it('should include identityData but NOT email when identity_data has no email field', () => {
    const result = mapSupabaseUser(
      fakeUser({
        identities: [
          {
            identity_id: 'id-1',
            provider: 'github',
            identity_data: { login: 'octocat' },
          },
        ],
      } as unknown as Partial<User>)
    );

    expect(result.identities).toEqual([
      {
        identityId: 'id-1',
        provider: 'github',
        identityData: { login: 'octocat' },
      },
    ]);
    expect(result.identities[0]).not.toHaveProperty('email');
  });

  it('should map multiple identities (google + github)', () => {
    const result = mapSupabaseUser(
      fakeUser({
        identities: [
          {
            identity_id: 'g-1',
            provider: 'google',
            identity_data: { email: 'g@example.com' },
          },
          {
            identity_id: 'gh-2',
            provider: 'github',
            identity_data: { email: 'gh@example.com', login: 'dev' },
          },
        ],
      } as unknown as Partial<User>)
    );

    expect(result.identities).toHaveLength(2);
    expect(result.identities[0]).toEqual({
      identityId: 'g-1',
      provider: 'google',
      email: 'g@example.com',
      identityData: { email: 'g@example.com' },
    });
    expect(result.identities[1]).toEqual({
      identityId: 'gh-2',
      provider: 'github',
      email: 'gh@example.com',
      identityData: { email: 'gh@example.com', login: 'dev' },
    });
  });
});
