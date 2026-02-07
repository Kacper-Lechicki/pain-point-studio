import { describe, expect, it } from 'vitest';

import { mapAuthError } from './errors';

describe('mapAuthError', () => {
  it('should map known Supabase errors to i18n keys', () => {
    expect(mapAuthError('Invalid login credentials')).toBe('auth.errors.invalidCredentials');
    expect(mapAuthError('Email not confirmed')).toBe('auth.errors.emailNotConfirmed');
    expect(mapAuthError('User already registered')).toBe('auth.errors.userAlreadyRegistered');
    expect(mapAuthError('Email rate limit exceeded')).toBe('auth.errors.rateLimitExceeded');
  });

  it('should match partial/prefix patterns for variable messages', () => {
    expect(mapAuthError('For security purposes, you can only request this after 58 seconds')).toBe(
      'auth.errors.rateLimitExceeded'
    );
  });

  it('should return unexpected error key for unknown messages', () => {
    expect(mapAuthError('Some unknown Supabase error')).toBe('auth.errors.unexpected');
    expect(mapAuthError('')).toBe('auth.errors.unexpected');
  });

  it('should always return a string starting with auth.errors.', () => {
    const knownMessages = [
      'Invalid login credentials',
      'Email not confirmed',
      'Random unknown error',
      '',
    ];

    for (const msg of knownMessages) {
      const result = mapAuthError(msg);

      expect(result).toMatch(/^auth\.errors\./);
    }
  });
});
