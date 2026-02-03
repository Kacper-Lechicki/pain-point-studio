import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@/lib/env';

import { isAuthenticated, isProtectionEnabled } from './deploy-credentials';

// Define a writable type for the environment to avoid 'any'
type MockEnv = {
  NODE_ENV: string;
  BASIC_AUTH_USER?: string | undefined;
  BASIC_AUTH_PASSWORD?: string | undefined;
};

// Mock the environment configuration module
vi.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'development',
    BASIC_AUTH_USER: 'admin',
    BASIC_AUTH_PASSWORD: 'password',
  },
}));

describe('Deploy Credentials Logic', () => {
  // Reset environment defaults before each test
  beforeEach(() => {
    (env as unknown as MockEnv).NODE_ENV = 'development';
    (env as unknown as MockEnv).BASIC_AUTH_USER = 'admin';
    (env as unknown as MockEnv).BASIC_AUTH_PASSWORD = 'password';
  });

  describe('isProtectionEnabled', () => {
    // Protection should ONLY be active in production with credentials set
    it('should be enabled in production with full credentials', () => {
      (env as unknown as MockEnv).NODE_ENV = 'production';
      expect(isProtectionEnabled()).toBe(true);
    });

    // Should be disabled in non-production environments
    it('should be disabled in development environment', () => {
      (env as unknown as MockEnv).NODE_ENV = 'development';
      expect(isProtectionEnabled()).toBe(false);
    });

    // Should be disabled if credentials are incomplete or missing
    it('should be disabled if credentials are missing', () => {
      (env as unknown as MockEnv).NODE_ENV = 'production';
      (env as unknown as MockEnv).BASIC_AUTH_PASSWORD = undefined;

      expect(isProtectionEnabled()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    // Helper to create a request with specific headers
    const createReq = (authHeader?: string) => {
      const headers = new Headers();

      if (authHeader) {
        headers.set('authorization', authHeader);
      }

      return new NextRequest('http://localhost', { headers });
    };

    // Valid credentials usage
    it('should return true for valid credentials', () => {
      const validAuth = `Basic ${btoa('admin:password')}`;
      const req = createReq(validAuth);

      expect(isAuthenticated(req)).toBe(true);
    });

    // Invalid password check
    it('should return false for invalid password', () => {
      const invalidAuth = `Basic ${btoa('admin:wrong')}`;
      const req = createReq(invalidAuth);

      expect(isAuthenticated(req)).toBe(false);
    });

    // Invalid username check
    it('should return false for invalid username', () => {
      const invalidAuth = `Basic ${btoa('wrong:password')}`;
      const req = createReq(invalidAuth);

      expect(isAuthenticated(req)).toBe(false);
    });

    // Missing header check
    it('should return false if authorization header is missing', () => {
      const req = createReq();
      expect(isAuthenticated(req)).toBe(false);
    });

    // Malformed header check
    it('should return false for malformed header', () => {
      const req = createReq('Bearer token');
      expect(isAuthenticated(req)).toBe(false);
    });

    // Malformed Base64/Format check
    it('should handle invalid base64 string gracefully', () => {
      const req = createReq('Basic invalid-base64-string');
      expect(isAuthenticated(req)).toBe(false);
    });
  });
});
