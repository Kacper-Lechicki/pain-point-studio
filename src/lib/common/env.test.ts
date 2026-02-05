// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Environment Configuration', () => {
  // Reset isolated modules and environment stubs before each test
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  // Clean up all environment stubs after each test finish
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Helper to stub all required environment variables with valid defaults
  const stubValidEnv = (overrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    };
    const merged = { ...defaults, ...overrides };
    Object.entries(merged).forEach(([key, value]) => vi.stubEnv(key, value));
  };

  // Test successful validation of correctly formatted environment variables
  it('should validate valid environment variables', async () => {
    stubValidEnv();

    const { env } = await import('./env');

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
    expect(env.NODE_ENV).toBe('test');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });

  // Test that an invalid URL format triggers a validation error
  it('should throw error for invalid URL', async () => {
    stubValidEnv({ NEXT_PUBLIC_APP_URL: 'not-a-url' });

    await expect(import('./env')).rejects.toThrow();
  });

  // Test that missing required environment variables trigger a validation error
  it('should throw error when missing required variables', async () => {
    stubValidEnv({ NEXT_PUBLIC_APP_URL: '' });

    await expect(import('./env')).rejects.toThrow();
  });

  // Test that an invalid Supabase URL triggers a validation error
  it('should throw error for invalid Supabase URL', async () => {
    stubValidEnv({ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });

    await expect(import('./env')).rejects.toThrow();
  });

  // Test that missing Supabase anon key triggers a validation error
  it('should throw error when missing Supabase anon key', async () => {
    stubValidEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: '' });

    await expect(import('./env')).rejects.toThrow();
  });
});
