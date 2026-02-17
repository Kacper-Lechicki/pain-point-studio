// @vitest-environment node
/** Environment variables: runtime validation and defaults. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Environment Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const stubValidEnv = (overrides: Record<string, string> = {}) => {
    const defaults: Record<string, string> = {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: 'https://example.com',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_AUTH_REDIRECT_URI: 'https://example.com/auth/callback',
      SUPABASE_AUTH_GITHUB_CLIENT_ID: 'test-github-id',
      SUPABASE_AUTH_GITHUB_SECRET: 'test-github-secret',
      SUPABASE_AUTH_GOOGLE_CLIENT_ID: 'test-google-id',
      SUPABASE_AUTH_GOOGLE_SECRET: 'test-google-secret',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_KEY: 'test-smtp-key',
    };

    const merged = { ...defaults, ...overrides };

    Object.entries(merged).forEach(([key, value]) => vi.stubEnv(key, value));
  };

  it('should validate valid environment variables', async () => {
    stubValidEnv();

    const { env } = await import('./env');

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://example.com');
    expect(env.NODE_ENV).toBe('test');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
    expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
  });

  it('should throw an error for invalid URL', async () => {
    stubValidEnv({ NEXT_PUBLIC_APP_URL: 'not-a-url' });

    await expect(import('./env')).rejects.toThrow();
  });

  it('should throw an error when missing required variables', async () => {
    stubValidEnv({ NEXT_PUBLIC_APP_URL: '' });

    await expect(import('./env')).rejects.toThrow();
  });

  it('should throw an error for invalid Supabase URL', async () => {
    stubValidEnv({ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' });

    await expect(import('./env')).rejects.toThrow();
  });

  it('should throw an error when missing Supabase anon key', async () => {
    stubValidEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: '' });

    await expect(import('./env')).rejects.toThrow();
  });
});
