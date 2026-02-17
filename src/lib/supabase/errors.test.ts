/** Supabase error mapping: auth error messages to i18n keys. */
import { describe, expect, it } from 'vitest';

import { mapSupabaseError } from './errors';

describe('mapSupabaseError', () => {
  it('should map known Supabase errors to i18n keys', () => {
    expect(mapSupabaseError('Invalid login credentials')).toBe('auth.errors.invalidCredentials');
    expect(mapSupabaseError('Email not confirmed')).toBe('auth.errors.emailNotConfirmed');
    expect(mapSupabaseError('User already registered')).toBe('auth.errors.userAlreadyRegistered');
    expect(mapSupabaseError('Email rate limit exceeded')).toBe('auth.errors.rateLimitExceeded');
    expect(mapSupabaseError('Password should be at least 8 characters')).toBe(
      'auth.errors.passwordTooShort'
    );
    expect(mapSupabaseError('New password should be different from the old password.')).toBe(
      'auth.errors.samePassword'
    );
    expect(mapSupabaseError('Unable to validate email address: invalid format')).toBe(
      'auth.errors.invalidEmail'
    );
    expect(mapSupabaseError('Signups not allowed for this instance')).toBe(
      'auth.errors.signupsDisabled'
    );
    expect(mapSupabaseError('Email link is invalid or has expired')).toBe(
      'auth.errors.linkExpired'
    );
  });

  it('should match partial/prefix patterns for variable messages', () => {
    expect(
      mapSupabaseError('For security purposes, you can only request this after 58 seconds')
    ).toBe('auth.errors.rateLimitExceeded');
  });

  it('should return unexpected error key for unknown messages', () => {
    expect(mapSupabaseError('Some unknown Supabase error')).toBe('auth.errors.unexpected');
    expect(mapSupabaseError('')).toBe('auth.errors.unexpected');
  });

  it('should always return a string starting with auth.errors.', () => {
    const knownMessages = [
      'Invalid login credentials',
      'Email not confirmed',
      'Random unknown error',
      '',
    ];

    for (const msg of knownMessages) {
      const result = mapSupabaseError(msg);

      expect(result).toMatch(/^auth\.errors\./);
    }
  });
});
